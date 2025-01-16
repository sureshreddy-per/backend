import { StorageUploadType } from "../enums/storage-upload-type.enum";
import { ApiProperty } from "@nestjs/swagger";

export interface FileUploadConfig {
  maxSizes: Record<StorageUploadType, number>;
  allowedTypes: Record<StorageUploadType, string[]>;
  storage: {
    type: "gcp";
    bucket: string;
    projectId: string;
    keyFilePath: string;
  };
}

export class FileUploadResult {
  @ApiProperty({
    description: "The public URL of the uploaded file",
    example: "https://storage.googleapis.com/bucket/images/123-file.jpg",
  })
  url: string;

  @ApiProperty({
    description: "The filename of the uploaded file",
    example: "123-file.jpg",
  })
  filename: string;

  @ApiProperty({
    description: "The MIME type of the uploaded file",
    example: "image/jpeg",
  })
  mimetype: string;

  @ApiProperty({
    description: "The size of the uploaded file in bytes",
    example: 1024567,
  })
  size: number;
} 