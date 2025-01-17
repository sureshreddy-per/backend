import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { StorageService, StorageOptions, StorageResponse } from '../interfaces/storage.interface';
import * as path from 'path';
import * as crypto from 'crypto';
import * as mime from 'mime-types';

@Injectable()
export class GcpStorageService implements StorageService {
  private readonly bucket: string;
  private readonly storage: Storage;
  private readonly logger = new Logger(GcpStorageService.name);

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('gcp.bucket');
    const projectId = this.configService.get<string>('gcp.projectId');
    const credentials = this.configService.get('gcp.credentials');

    this.logger.debug(`GCP Config - Bucket: ${this.bucket}, ProjectId: ${projectId}`);

    if (!this.bucket || !projectId || !credentials) {
      const missing = [];
      if (!this.bucket) missing.push('bucket');
      if (!projectId) missing.push('projectId');
      if (!credentials) missing.push('credentials');
      this.logger.error(`Missing required GCP configuration: ${missing.join(', ')}`);
      throw new Error(`Missing required GCP configuration: ${missing.join(', ')}`);
    }

    this.storage = new Storage({
      projectId,
      credentials,
    });
    
    this.logger.debug(`Initialized GCP Storage with bucket: ${this.bucket}`);
    this.initializeBucketAccess();
  }

  private async initializeBucketAccess(): Promise<void> {
    try {
      const [bucket] = await this.storage.bucket(this.bucket).get();
      const [metadata] = await bucket.getMetadata();
      
      this.logger.debug(`Bucket ${this.bucket} metadata:`, metadata);
      
      // Don't try to modify ACLs when uniform bucket-level access is enabled
      if (metadata.iamConfiguration?.uniformBucketLevelAccess?.enabled) {
        this.logger.debug(`Bucket ${this.bucket} has uniform bucket-level access enabled`);
      }
    } catch (error) {
      this.logger.warn(`Note about bucket access: ${error.message}`);
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
    if (!this.bucket) {
      throw new Error('A bucket name is needed to use Cloud Storage');
    }

    const uniqueFilename = this.generateUniqueFilename(filename);
    const filePath = options.path ? `${options.path}/${uniqueFilename}` : uniqueFilename;
    const gcpFile = this.storage.bucket(this.bucket).file(filePath);

    try {
      // Upload the file without setting ACL
      await new Promise<void>((resolve, reject) => {
        const stream = gcpFile.createWriteStream({
          metadata: {
            contentType: options.contentType || 'application/octet-stream',
            metadata: {
              ...options.metadata,
              originalName: filename,
              uploadedAt: new Date().toISOString(),
            },
          },
        });

        stream.on('error', reject);
        stream.on('finish', () => resolve());
        stream.end(typeof file === 'string' ? Buffer.from(file) : file);
      });

      // Get file metadata
      const [metadata] = await gcpFile.getMetadata();

      // Generate a public URL
      const publicUrl = `https://storage.googleapis.com/${this.bucket}/${filePath}`;

      return {
        url: publicUrl,
        key: filePath,
        bucket: this.bucket,
        contentType: metadata.contentType || 'application/octet-stream',
        size: Number(metadata.size || 0),
        metadata: metadata.metadata as Record<string, string>,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file ${filename}: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(key: string, bucket?: string): Promise<void> {
    if (!this.bucket) {
      throw new Error('A bucket name is needed to use Cloud Storage');
    }

    try {
      await this.storage.bucket(bucket || this.bucket).file(key).delete();
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSignedUrl(
    key: string,
    expiresIn: number = 7 * 24 * 60 * 60, // 7 days in seconds
    bucket?: string,
  ): Promise<string> {
    if (!this.bucket) {
      throw new Error('A bucket name is needed to use Cloud Storage');
    }

    const file = this.storage.bucket(bucket || this.bucket).file(key);
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresIn * 1000,
    });

    return url;
  }

  getPublicUrl(key: string, bucket?: string): string {
    const bucketName = bucket || this.bucket;
    if (!bucketName) {
      throw new Error('A bucket name is needed to use Cloud Storage');
    }
    return `https://storage.googleapis.com/${bucketName}/${key}`;
  }

  async downloadFile(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
    try {
      // Extract filename from URL
      const urlObj = new URL(url);
      const key = urlObj.pathname.split('/').pop();
      if (!key) {
        throw new Error('Invalid URL: Could not extract filename');
      }

      // Get file from bucket
      const file = this.storage.bucket(this.bucket).file(key);
      const [metadata] = await file.getMetadata();
      const [fileContent] = await file.download();

      return {
        buffer: fileContent,
        mimeType: metadata.contentType || 'application/octet-stream',
      };
    } catch (error) {
      this.logger.error(`Failed to get file content: ${error.message}`, error.stack);
      throw error;
    }
  }
}