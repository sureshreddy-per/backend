import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Storage, GetSignedUrlConfig } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";

export enum StorageUploadType {
  IMAGES = "images",
  VIDEOS = "videos",
  THUMBNAILS = "thumbnails",
  REPORTS = "reports",
  DOCUMENTS = "documents",
}

@Injectable()
export class GcpStorageService implements OnModuleInit {
  private storage: Storage;
  private readonly logger = new Logger(GcpStorageService.name);
  private readonly bucket: string;

  constructor(private configService: ConfigService) {
    const bucket = this.configService.get<string>("GCP_BUCKET_NAME");
    const projectId = this.configService.get<string>("GCP_PROJECT_ID");
    const keyFilename = this.configService.get<string>("GCP_SERVICE_ACCOUNT_KEY");
    
    if (!bucket || !projectId || !keyFilename) {
      this.logger.error('Missing required GCP configuration', { bucket, projectId, keyFilename });
      throw new Error('Missing required GCP configuration. Please check your environment variables.');
    }
    
    this.bucket = bucket;
    this.logger.debug(`Initializing GCP Storage with bucket: ${bucket}, project: ${projectId}`);
    
    // Initialize GCP Storage with absolute path
    const path = require('path');
    const keyPath = path.resolve(process.cwd(), keyFilename);
    
    if (!require('fs').existsSync(keyPath)) {
      this.logger.error(`GCP service account key file not found at: ${keyPath}`);
      throw new Error(`GCP service account key file not found at: ${keyPath}`);
    }
    
    this.logger.debug(`Using service account key at: ${keyPath}`);
    
    this.storage = new Storage({
      projectId,
      keyFilename: keyPath,
      apiEndpoint: `https://storage.googleapis.com`,
    });
  }

  async onModuleInit() {
    try {
      this.logger.debug('Verifying GCP Storage configuration...');
      await this.verifyBucket();
      this.logger.debug('GCP Storage configuration verified successfully');
    } catch (error) {
      this.logger.error('Failed to verify GCP Storage configuration', error.stack);
      throw error;
    }
  }

  private async verifyBucket(): Promise<void> {
    try {
      this.logger.debug(`Checking if bucket ${this.bucket} exists...`);
      const [exists] = await this.storage.bucket(this.bucket).exists();
      
      if (!exists) {
        this.logger.error(`Bucket ${this.bucket} does not exist`);
        throw new Error(`Bucket ${this.bucket} does not exist`);
      }
      
      this.logger.debug(`Successfully verified bucket: ${this.bucket}`);
      
      // Test bucket access
      this.logger.debug('Testing bucket access...');
      const [files] = await this.storage.bucket(this.bucket).getFiles({ maxResults: 1 });
      this.logger.debug(`Successfully listed files in bucket: ${this.bucket}`);
      
    } catch (error) {
      this.logger.error(`Failed to verify bucket: ${error.message}`, error.stack);
      throw error;
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    type: StorageUploadType = StorageUploadType.IMAGES,
  ): Promise<{ url: string; filename: string }> {
    try {
      this.logger.debug(`Starting file upload to bucket: ${this.bucket}, type: ${type}`);
      this.logger.debug(`File details: name=${file.originalname}, size=${file.size}, type=${file.mimetype}`);
      
      const bucket = this.storage.bucket(this.bucket);
      const uniqueFileName = `${type}/${uuidv4()}-${file.originalname}`;
      const blob = bucket.file(uniqueFileName);

      this.logger.debug(`Created blob for file: ${uniqueFileName}`);

      // Create write stream for uploading
      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
        resumable: false,
      });

      // Handle upload
      await new Promise((resolve, reject) => {
        blobStream.on("error", (error) => {
          this.logger.error(`Error uploading file: ${error.message}`, error.stack);
          reject(error);
        });

        blobStream.on("finish", () => {
          this.logger.debug(`Successfully uploaded file: ${uniqueFileName}`);
          resolve(true);
        });

        blobStream.end(file.buffer);
      });

      // Generate a signed URL that expires in 7 days
      this.logger.debug(`Generating signed URL for file: ${uniqueFileName}`);
      const [signedUrl] = await blob.getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      this.logger.debug(`Generated signed URL for file: ${uniqueFileName}`);
      return {
        url: signedUrl,
        filename: uniqueFileName,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      const file = this.storage.bucket(this.bucket).file(filename);
      await file.delete();
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw error;
    }
  }

  async generateSignedUrl(fileName: string, expiresInMinutes = 15): Promise<string> {
    try {
      const options: GetSignedUrlConfig = {
        version: "v4",
        action: "read",
        expires: Date.now() + expiresInMinutes * 60 * 1000,
      };

      const [signedUrl] = await this.storage
        .bucket(this.bucket)
        .file(fileName)
        .getSignedUrl(options);

      return signedUrl;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`);
      throw error;
    }
  }
} 