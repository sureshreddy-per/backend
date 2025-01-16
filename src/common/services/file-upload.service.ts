import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GcpStorageService, StorageUploadType } from "./gcp-storage.service";

@Injectable()
export class FileUploadService {
  constructor(
    private readonly configService: ConfigService,
    private readonly gcpStorageService: GcpStorageService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    type: StorageUploadType = StorageUploadType.IMAGES,
  ): Promise<{ url: string; filename: string }> {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    try {
      const result = await this.gcpStorageService.uploadFile(file, type);
      return result;
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      await this.gcpStorageService.deleteFile(filename);
    } catch (error) {
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  async generateSignedUrl(fileName: string, expiresInMinutes = 15): Promise<string> {
    try {
      return await this.gcpStorageService.generateSignedUrl(fileName, expiresInMinutes);
    } catch (error) {
      throw new BadRequestException(`Failed to generate signed URL: ${error.message}`);
    }
  }
}
