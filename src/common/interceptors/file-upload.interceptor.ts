import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { FileValidator } from '../validators/file.validator';
import sharp from 'sharp';
import { Express } from 'express';

// Extend Express.Multer.File to include metadata
interface FileWithMetadata extends Express.Multer.File {
  metadata?: {
    originalName: string;
    size: number;
    mimeType: string;
    dimensions?: {
      width: number;
      height: number;
    };
  };
}

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  constructor(private readonly configService: ConfigService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const file = request.file as FileWithMetadata;

    if (!file) {
      return next.handle();
    }

    // Validate file
    FileValidator.validateFile(file, {
      maxSize: this.configService.get('upload.maxSize'),
      allowedTypes: this.configService.get('upload.allowedTypes'),
    });

    // Add metadata
    file.metadata = {
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };

    // Process image if applicable
    if (file.mimetype.startsWith('image/')) {
      try {
        const imageProcessor = sharp(file.buffer);
        const metadata = await imageProcessor.metadata();

        if (metadata.width && metadata.height) {
          file.metadata.dimensions = {
            width: metadata.width,
            height: metadata.height,
          };
        }

        // Optimize image in production
        if (process.env.NODE_ENV === 'production') {
          const optimizedBuffer = await imageProcessor
            .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
          file.buffer = optimizedBuffer;
        }
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }

    return next.handle();
  }
}