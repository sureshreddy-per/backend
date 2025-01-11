import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Media, MediaType } from "../entities/media.entity";

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
  ) {}

  async create(data: {
    url: string;
    type: MediaType;
    mime_type?: string;
    size?: number;
    original_name?: string;
    metadata?: {
      width?: number;
      height?: number;
      duration?: number;
      thumbnail_url?: string;
    };
  }): Promise<Media> {
    const media = this.mediaRepository.create(data);
    return this.mediaRepository.save(media);
  }

  async findOne(id: string): Promise<Media> {
    return this.mediaRepository.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.mediaRepository.delete(id);
  }
} 