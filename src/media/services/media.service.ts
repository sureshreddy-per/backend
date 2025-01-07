import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Media, MediaType, MediaCategory } from '../entities';
import { S3Service } from '../../common/services/s3.service';
import { MediaProcessorService, ProcessedImage } from './media-processor.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly s3Service: S3Service,
    private readonly mediaProcessorService: MediaProcessorService,
  ) {}

  async uploadImage(
    file: Express.Multer.File,
    category: MediaCategory,
    entity_id: string,
    user_id: string
  ): Promise<Media> {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    // Process image and create thumbnail
    const processedImage = await this.mediaProcessorService.processImage(file.buffer);
    const thumbnail = await this.mediaProcessorService.createThumbnail(file.buffer);

    // Upload processed image and thumbnail to S3
    const imageUrl = await this.s3Service.uploadFile(
      { ...file, buffer: processedImage.buffer },
      'images'
    );
    const thumbnailUrl = await this.s3Service.uploadFile(
      { ...file, buffer: thumbnail.buffer },
      'thumbnails'
    );

    // Create media record
    const media = this.mediaRepository.create({
      original_name: file.originalname,
      mime_type: file.mimetype,
      size: processedImage.size,
      url: imageUrl,
      key: this.s3Service.extractKeyFromUrl(imageUrl),
      type: MediaType.IMAGE,
      category,
      entity_id,
      user_id,
      metadata: {
        width: processedImage.width,
        height: processedImage.height,
        thumbnail_url: thumbnailUrl,
      },
    });

    return this.mediaRepository.save(media);
  }

  async uploadVideo(
    file: Express.Multer.File,
    category: MediaCategory,
    entity_id: string,
    user_id: string
  ): Promise<Media> {
    if (!file.mimetype.startsWith('video/')) {
      throw new BadRequestException('File must be a video');
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      throw new BadRequestException('Video size exceeds 50MB limit');
    }

    // Upload video to S3
    const videoUrl = await this.s3Service.uploadFile(file, 'videos');

    // Create media record
    const media = this.mediaRepository.create({
      original_name: file.originalname,
      mime_type: file.mimetype,
      size: file.size,
      url: videoUrl,
      key: this.s3Service.extractKeyFromUrl(videoUrl),
      type: MediaType.VIDEO,
      category,
      entity_id,
      user_id,
    });

    return this.mediaRepository.save(media);
  }

  async delete(id: string): Promise<void> {
    const media = await this.mediaRepository.findOne({
      where: { id }
    });

    if (!media) {
      throw new BadRequestException('Media not found');
    }

    // Delete from S3
    await this.s3Service.deleteFile(media.url);
    if (media.metadata?.thumbnail_url) {
      await this.s3Service.deleteFile(media.metadata.thumbnail_url);
    }

    // Delete from database
    await this.mediaRepository.remove(media);
  }

  async findByEntity(entity_id: string): Promise<Media[]> {
    return this.mediaRepository.find({
      where: { entity_id },
      order: { created_at: 'DESC' },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOrphanedMedia() {
    // Find media records older than 24 hours with no entity_id
    const orphanedMedia = await this.mediaRepository.find({
      where: {
        entity_id: IsNull(),
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    // Delete each orphaned media
    for (const media of orphanedMedia) {
      await this.delete(media.id);
    }
  }
} 