import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { StorageUploadType } from "../enums/storage-upload-type.enum";
import * as mime from 'mime-types';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly maxSizes: Record<StorageUploadType, number>;
  private readonly allowedTypes: Record<StorageUploadType, string[]>;
  private readonly allowedMimeTypes: Record<StorageUploadType, string[]>;
  private readonly type: StorageUploadType;

  constructor(
    private readonly configService: ConfigService,
    type: StorageUploadType,
  ) {
    this.type = type;
    
    this.maxSizes = {
      [StorageUploadType.IMAGES]: this.getMbToBytes(
        this.configService.get<number>("MAX_IMAGE_SIZE_MB", 5),
      ),
      [StorageUploadType.VIDEOS]: this.getMbToBytes(
        this.configService.get<number>("MAX_VIDEO_SIZE_MB", 100),
      ),
      [StorageUploadType.THUMBNAILS]: this.getMbToBytes(
        this.configService.get<number>("MAX_THUMBNAIL_SIZE_MB", 2),
      ),
      [StorageUploadType.REPORTS]: this.getMbToBytes(
        this.configService.get<number>("MAX_REPORT_SIZE_MB", 10),
      ),
      [StorageUploadType.DOCUMENTS]: this.getMbToBytes(
        this.configService.get<number>("MAX_DOCUMENT_SIZE_MB", 10),
      ),
    };

    this.allowedTypes = {
      [StorageUploadType.IMAGES]: this.getTypesArray(
        this.configService.get<string>("ALLOWED_IMAGE_TYPES", "jpg,jpeg,png,gif,heic,heif"),
      ),
      [StorageUploadType.VIDEOS]: this.getTypesArray(
        this.configService.get<string>("ALLOWED_VIDEO_TYPES", "mp4,mov,avi"),
      ),
      [StorageUploadType.THUMBNAILS]: this.getTypesArray(
        this.configService.get<string>("ALLOWED_THUMBNAIL_TYPES", "jpg,jpeg,png"),
      ),
      [StorageUploadType.REPORTS]: this.getTypesArray(
        this.configService.get<string>("ALLOWED_REPORT_TYPES", "pdf"),
      ),
      [StorageUploadType.DOCUMENTS]: this.getTypesArray(
        this.configService.get<string>("ALLOWED_DOCUMENT_TYPES", "pdf,doc,docx"),
      ),
    };

    this.allowedMimeTypes = {
      [StorageUploadType.IMAGES]: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/heic',
        'image/heif'
      ],
      [StorageUploadType.VIDEOS]: [
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo'
      ],
      [StorageUploadType.THUMBNAILS]: [
        'image/jpeg',
        'image/png'
      ],
      [StorageUploadType.REPORTS]: [
        'application/pdf'
      ],
      [StorageUploadType.DOCUMENTS]: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
    };
  }

  static forType(type: StorageUploadType) {
    return new FileValidationPipe(new ConfigService(), type);
  }

  transform(value: Express.Multer.File | Express.Multer.File[], metadata: ArgumentMetadata): Express.Multer.File | Express.Multer.File[] {
    if (!value) {
      throw new BadRequestException("No file uploaded");
    }

    if (Array.isArray(value)) {
      const maxFiles = this.configService.get<number>("MAX_FILES_PER_REQUEST", 5);
      if (value.length > maxFiles) {
        throw new BadRequestException(`Maximum ${maxFiles} files allowed per request`);
      }
      value.forEach((file) => this.validateFile(file));
    } else {
      this.validateFile(value);
    }
    return value;
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    // Check file extension
    const fileExtension = file.originalname.split(".").pop()?.toLowerCase();
    if (!fileExtension || !this.allowedTypes[this.type].includes(fileExtension)) {
      throw new BadRequestException(
        `Invalid file type. Must be one of: ${this.allowedTypes[this.type].join(", ")}`,
      );
    }

    // Check MIME type
    if (!this.allowedMimeTypes[this.type].includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid MIME type. Must be one of: ${this.allowedMimeTypes[this.type].join(", ")}`,
      );
    }

    // Check file size
    if (file.size > this.maxSizes[this.type]) {
      throw new BadRequestException(
        `File size exceeds the maximum limit of ${this.maxSizes[this.type] / (1024 * 1024)}MB`,
      );
    }
  }

  private getMbToBytes(mb: number): number {
    return mb * 1024 * 1024;
  }

  private getTypesArray(types: string): string[] {
    return types.split(",").map((type) => type.trim().toLowerCase());
  }
} 