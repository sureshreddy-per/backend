import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageService, StorageOptions, StorageResponse } from '../interfaces/storage.interface';
import * as path from 'path';
import * as crypto from 'crypto';
import * as mime from 'mime-types';

@Injectable()
export class S3Service implements StorageService, OnModuleInit {
  private s3Client: S3Client | null = null;
  private bucket: string | null = null;
  private readonly maxAttempts: number;
  private readonly logger = new Logger(S3Service.name);
  private isInitialized = false;

  constructor(private readonly configService: ConfigService) {
    const isProd = this.configService.get('NODE_ENV') === 'production';
    this.maxAttempts = isProd ? 5 : 3;
  }

  async onModuleInit() {
    await this.initializeS3Client();
  }

  private async initializeS3Client() {
    try {
      // Check if S3 is enabled
      const useS3 = this.configService.get<boolean>('USE_S3') === true;
      
      if (!useS3) {
        this.logger.log('S3 is disabled. File operations will be simulated.');
        this.isInitialized = true;
        return;
      }

      this.bucket = this.configService.get<string>('S3_BUCKET') || 
                    this.configService.get<string>('AWS_S3_BUCKET');
      const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
      const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
      const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

      if (!this.bucket || !accessKeyId || !secretAccessKey) {
        this.logger.warn('S3 credentials not found. File operations will be simulated.');
        this.isInitialized = true;
        return;
      }

      this.s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        maxAttempts: this.maxAttempts,
      });

      this.isInitialized = true;
      this.logger.log(`S3 client initialized successfully with bucket: ${this.bucket}`);
    } catch (error) {
      this.logger.warn(`Failed to initialize S3 client: ${error.message}. File operations will be simulated.`);
      this.isInitialized = true;
    }
  }

  private ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('S3Service is not initialized. Please wait for onModuleInit to complete.');
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
    this.ensureInitialized();

    // Simulation mode when S3 is not configured
    if (!this.s3Client || !this.bucket) {
      this.logger.debug(`Simulating upload of file: ${filename}`);
      const uniqueFilename = this.generateUniqueFilename(filename);
      return {
        url: `http://localhost:3000/mock-s3/${uniqueFilename}`,
        key: uniqueFilename,
        bucket: 'mock-bucket',
        contentType: options.contentType || mime.lookup(filename) || 'application/octet-stream',
        size: Buffer.isBuffer(file) ? Buffer.byteLength(file) : Buffer.byteLength(file, 'utf8'),
        metadata: options.metadata || {},
      };
    }

    // Check file size (5MB limit for single upload)
    if (Buffer.isBuffer(file) && Buffer.byteLength(file) > 5 * 1024 * 1024) {
      throw new Error('File size exceeds 5MB limit');
    }

    const uniqueFilename = this.generateUniqueFilename(filename);
    const key = options.path ? `${options.path}/${uniqueFilename}` : uniqueFilename;

    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: typeof file === 'string' ? Buffer.from(file) : file,
          ContentType: options.contentType || mime.lookup(filename) || 'application/octet-stream',
          Metadata: {
            ...options.metadata,
            originalName: filename,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      await upload.done();

      const url = `https://${this.bucket}.s3.amazonaws.com/${key}`;

      return {
        url,
        key,
        bucket: this.bucket,
        contentType: options.contentType || mime.lookup(filename) || 'application/octet-stream',
        size: Buffer.isBuffer(file) ? Buffer.byteLength(file) : Buffer.byteLength(file, 'utf8'),
        metadata: options.metadata || {},
      };
    } catch (error) {
      this.logger.error(`Failed to upload file ${filename}: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(key: string, bucket?: string): Promise<void> {
    this.ensureInitialized();

    // Simulation mode when S3 is not configured
    if (!this.s3Client || !this.bucket) {
      this.logger.debug(`Simulating delete of file: ${key}`);
      return;
    }

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket || this.bucket,
          Key: key,
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}: ${error.message}`);
      throw error;
    }
  }

  async downloadFile(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
    this.ensureInitialized();

    // Simulation mode when S3 is not configured
    if (!this.s3Client || !this.bucket) {
      this.logger.debug(`Simulating download of file: ${url}`);
      return {
        buffer: Buffer.from('mock-file-content'),
        mimeType: 'application/octet-stream',
      };
    }

    try {
      const key = new URL(url).pathname.slice(1);
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const chunks: Buffer[] = [];

      if (response.Body) {
        // @ts-ignore - AWS SDK types are not fully compatible with Node.js streams
        for await (const chunk of response.Body as any) {
          chunks.push(Buffer.from(chunk));
        }
      }

      return {
        buffer: Buffer.concat(chunks as Uint8Array[]),
        mimeType: response.ContentType || 'application/octet-stream',
      };
    } catch (error) {
      this.logger.error(`Failed to download file: ${error.message}`);
      throw error;
    }
  }

  async getSignedUrl(
    key: string,
    expiresIn: number = 3600,
    bucket?: string,
  ): Promise<string> {
    this.ensureInitialized();

    // Simulation mode when S3 is not configured
    if (!this.s3Client || !this.bucket) {
      this.logger.debug(`Simulating signed URL for file: ${key}`);
      return `http://localhost:3000/mock-s3/${key}?signed=true&expires=${Date.now() + expiresIn * 1000}`;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: bucket || this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(`Failed to generate signed URL for ${key}: ${error.message}`);
      throw error;
    }
  }

  getPublicUrl(key: string, bucket?: string): string {
    this.ensureInitialized();

    // Simulation mode when S3 is not configured
    if (!this.s3Client || !this.bucket) {
      return `http://localhost:3000/mock-s3/${key}`;
    }

    const bucketName = bucket || this.bucket;
    return `https://${bucketName}.s3.amazonaws.com/${key}`;
  }
}
