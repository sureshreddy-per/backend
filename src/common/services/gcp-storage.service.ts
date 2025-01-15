import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { StorageService, StorageOptions, StorageResponse } from '../interfaces/storage.interface';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class GcpStorageService implements StorageService {
  private readonly storage: Storage;
  private readonly logger = new Logger(GcpStorageService.name);
  private readonly defaultBucket: string;

  constructor(private readonly configService: ConfigService) {
    this.storage = new Storage({
      projectId: this.configService.get<string>('gcp.projectId'),
      keyFilename: this.configService.get<string>('gcp.keyFilePath'),
    });
    this.defaultBucket = this.configService.get<string>('gcp.bucket');
  }

  private generateUniqueFilename(originalFilename: string): string {
    const ext = path.extname(originalFilename);
    const hash = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    return `${path.basename(originalFilename, ext)}-${timestamp}-${hash}${ext}`;
  }

  async uploadFile(
    file: Buffer | string,
    filename: string,
    options: StorageOptions = {},
  ): Promise<StorageResponse> {
    try {
      const bucket = this.storage.bucket(options.bucket || this.defaultBucket);
      const uniqueFilename = this.generateUniqueFilename(filename);
      const filePath = options.path ? `${options.path}/${uniqueFilename}` : uniqueFilename;
      const blob = bucket.file(filePath);

      // Set file metadata
      const metadata = {
        contentType: options.contentType || 'application/octet-stream',
        metadata: {
          ...options.metadata,
          originalName: filename,
          uploadedAt: new Date().toISOString(),
        },
      };

      // Upload file
      if (typeof file === 'string') {
        await blob.save(file, { metadata });
      } else {
        await blob.save(file, { metadata });
      }

      // Make file public if requested
      if (options.isPublic) {
        await blob.makePublic();
      }

      // Get file metadata
      const [metadata_] = await blob.getMetadata();

      return {
        url: options.isPublic ? this.getPublicUrl(filePath, bucket.name) : await this.getSignedUrl(filePath, 3600, bucket.name),
        key: filePath,
        bucket: bucket.name,
        contentType: metadata_.contentType || 'application/octet-stream',
        size: Number(metadata_.size || 0),
        metadata: metadata_.metadata as Record<string, string>,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async deleteFile(key: string, bucket?: string): Promise<void> {
    try {
      const file = this.storage.bucket(bucket || this.defaultBucket).file(key);
      await file.delete();
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async getSignedUrl(
    key: string,
    expiresIn: number = 3600,
    bucket?: string,
  ): Promise<string> {
    try {
      const file = this.storage.bucket(bucket || this.defaultBucket).file(key);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresIn * 1000,
      });
      return url;
    } catch (error) {
      this.logger.error(`Failed to get signed URL: ${error.message}`, error.stack);
      throw new Error(`Failed to get signed URL: ${error.message}`);
    }
  }

  getPublicUrl(key: string, bucket?: string): string {
    const bucketName = bucket || this.defaultBucket;
    return `https://storage.googleapis.com/${bucketName}/${key}`;
  }
}