import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
}

@Injectable()
export class MediaProcessorService {
  async processImage(
    buffer: Buffer,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<ProcessedImage> {
    const {
      maxWidth = 2048,
      maxHeight = 2048,
      quality = 80,
      format = 'jpeg'
    } = options;

    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Calculate new dimensions while maintaining aspect ratio
    const { width, height } = this.calculateDimensions(
      metadata.width || 0,
      metadata.height || 0,
      maxWidth,
      maxHeight
    );

    // Process image
    const processedBuffer = await image
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toFormat(format, { quality })
      .toBuffer();

    return {
      buffer: processedBuffer,
      width,
      height,
      format,
      size: processedBuffer.length,
    };
  }

  async createThumbnail(
    buffer: Buffer,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<ProcessedImage> {
    const {
      width = 200,
      height = 200,
      quality = 70,
      format = 'jpeg'
    } = options;

    const thumbnail = await sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'centre',
      })
      .toFormat(format, { quality })
      .toBuffer();

    return {
      buffer: thumbnail,
      width,
      height,
      format,
      size: thumbnail.length,
    };
  }

  async extractMetadata(buffer: Buffer): Promise<sharp.Metadata> {
    return sharp(buffer).metadata();
  }

  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): ImageDimensions {
    const ratio = Math.min(
      maxWidth / originalWidth,
      maxHeight / originalHeight,
      1
    );

    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio),
    };
  }
} 