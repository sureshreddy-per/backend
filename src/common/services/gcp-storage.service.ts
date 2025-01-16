import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { StorageService, StorageOptions, StorageResponse } from '../interfaces/storage.interface';
import * as path from 'path';
import * as crypto from 'crypto';
import * as mime from 'mime-types';

@Injectable()
export class GcpStorageService implements StorageService {
  private readonly storage: Storage;
  private readonly bucket: string;
  private readonly logger = new Logger(GcpStorageService.name);

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('GCP_STORAGE_BUCKET');
    this.storage = new Storage({
      projectId: this.configService.get<string>('GCP_PROJECT_ID'),
      keyFilename: this.configService.get<string>('GCP_KEY_FILE'),
    });
  }

  private async initializeBucketAccess() {
    try {
      const bucket = this.storage.bucket(this.bucket);
      await bucket.makePublic();
      this.logger.log(`Successfully made bucket ${this.bucket} public`);
    } catch (error) {
      this.logger.error(`Failed to make bucket public: ${error.message}`, error.stack);
      // Don't throw error to allow service to start
    }
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
      const bucket = this.storage.bucket(options.bucket || this.bucket);
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

      // Always make file public since bucket is public
      await blob.makePublic();

      // Get file metadata
      const [metadata_] = await blob.getMetadata();

      return {
        url: this.getPublicUrl(filePath, bucket.name), // Always use public URL
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
      const file = this.storage.bucket(bucket || this.bucket).file(key);
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
      const file = this.storage.bucket(bucket || this.bucket).file(key);
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
    const bucketName = bucket || this.bucket;
    return `https://storage.googleapis.com/${bucketName}/${key}`;
  }

  async getFileContent(key: string, bucket?: string): Promise<Buffer> {
    try {
      const file = this.storage.bucket(bucket || this.bucket).file(key);
      const [content] = await file.download();
      return content;
    } catch (error) {
      this.logger.error(`Failed to get file content: ${error.message}`, error.stack);
      throw new Error(`Failed to get file content: ${error.message}`);
    }
  }

  async downloadFile(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
    try {
      // Extract filename from URL
      const filename = url.split(`${this.bucket}/`)[1];
      if (!filename) {
        throw new Error('Invalid GCP Storage URL');
      }

      const bucket = this.storage.bucket(this.bucket);
      const file = bucket.file(filename);

      // Get file metadata
      const [metadata] = await file.getMetadata();
      const mimeType = metadata.contentType || mime.lookup(filename) || 'application/octet-stream';

      // Download file
      const [buffer] = await file.download();

      return { buffer, mimeType };
    } catch (error) {
      this.logger.error(`Error downloading file: ${error.message}`, error.stack);
      throw error;
    }
  }
}