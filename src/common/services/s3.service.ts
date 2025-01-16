import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { StorageService, StorageOptions, StorageResponse } from '../interfaces/storage.interface';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service implements StorageService {
  private s3Client: S3Client;
  private readonly logger = new Logger(S3Service.name);
  private readonly isProduction: boolean;
  private readonly defaultBucket: string;

  constructor(private configService: ConfigService) {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.s3Client = new S3Client({
      region: this.configService.get("aws.region"),
      credentials: {
        accessKeyId: this.configService.get("aws.accessKeyId"),
        secretAccessKey: this.configService.get("aws.secretAccessKey"),
      },
      maxAttempts: this.isProduction ? 
        parseInt(process.env.S3_MAX_ATTEMPTS_PROD || '5') : 
        parseInt(process.env.S3_MAX_ATTEMPTS_DEV || '3'),
    });
    this.defaultBucket = this.configService.get<string>('aws.bucket');
  }

  async uploadFile(
    file: Buffer | string,
    filename: string,
    options: StorageOptions = {},
  ): Promise<StorageResponse> {
    try {
      const bucket = options.bucket || this.defaultBucket;
      const fileHash = crypto.createHash('sha256')
        .update(typeof file === 'string' ? file : file.toString())
        .digest('hex')
        .substring(0, 8);

      const uniqueFileName = options.path
        ? `${options.path}/${fileHash}-${uuidv4()}-${this.sanitizeFileName(filename)}`
        : `${fileHash}-${uuidv4()}-${this.sanitizeFileName(filename)}`;

      const uploadParams = {
        Bucket: bucket,
        Key: uniqueFileName,
        Body: file,
        ContentType: options.contentType || 'application/octet-stream',
        Metadata: {
          originalName: filename,
          uploadTimestamp: new Date().toISOString(),
          ...options.metadata,
        },
        ACL: options.isPublic ? ObjectCannedACL.public_read : ObjectCannedACL.private,
      };

      // Use multipart upload for large files
      if (Buffer.isBuffer(file) && file.length > 5 * 1024 * 1024) { // 5MB
        const multipartUpload = new Upload({
          client: this.s3Client,
          params: uploadParams,
          queueSize: 4,
          partSize: 5 * 1024 * 1024,
        });

        await multipartUpload.done();
      } else {
        const command = new PutObjectCommand(uploadParams);
        await this.s3Client.send(command);
      }

      // Get file metadata after upload
      const headCommand = new HeadObjectCommand({
        Bucket: bucket,
        Key: uniqueFileName,
      });
      const headResponse = await this.s3Client.send(headCommand);

      return {
        url: options.isPublic ? this.getPublicUrl(uniqueFileName, bucket) : await this.getSignedUrl(uniqueFileName, 3600, bucket),
        key: uniqueFileName,
        bucket: bucket,
        contentType: headResponse.ContentType || options.contentType || 'application/octet-stream',
        size: headResponse.ContentLength || 0,
        metadata: headResponse.Metadata,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file to S3: ${error.message}`, error.stack);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async deleteFile(key: string, bucket?: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket || this.defaultBucket,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error(`Failed to delete file from S3: ${error.message}`, error.stack);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600, bucket?: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket || this.defaultBucket,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`, error.stack);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  getPublicUrl(key: string, bucket?: string): string {
    const bucketName = bucket || this.defaultBucket;
    return `https://${bucketName}.s3.amazonaws.com/${key}`;
  }

  private sanitizeFileName(fileName: string): string {
    return fileName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
