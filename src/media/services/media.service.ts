import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media, MediaType } from '../entities/media.entity';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../../common/interfaces/storage.interface';
import { STORAGE_SERVICE } from '../../common/providers/storage.provider';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  async uploadFile(file: Express.Multer.File): Promise<Media> {
    const uploadResult = await this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      {
        contentType: file.mimetype,
        isPublic: true,
        metadata: {
          originalName: file.originalname,
          size: file.size.toString(),
          mimeType: file.mimetype,
        },
      }
    );

    const media = new Media();
    media.url = uploadResult.url;
    media.key = uploadResult.key;
    media.type = this.getMediaType(file.mimetype);
    media.mime_type = file.mimetype;
    media.size = file.size;
    media.original_name = file.originalname;
    media.metadata = uploadResult.metadata || {};

    return this.mediaRepository.save(media);
  }

  async getFile(id: string): Promise<Media> {
    const media = await this.mediaRepository.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException('Media not found');
    }
    return media;
  }

  async deleteFile(id: string): Promise<void> {
    const media = await this.getFile(id);
    await this.storageService.deleteFile(media.key);
    await this.mediaRepository.remove(media);
  }

  private getMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) {
      return MediaType.IMAGE;
    }
    if (mimeType.startsWith('video/')) {
      return MediaType.VIDEO;
    }
    return MediaType.DOCUMENT;
  }
}