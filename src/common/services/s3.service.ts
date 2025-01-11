import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from "uuid";

export type S3UploadType = "images" | "videos" | "thumbnails" | "reports";

@Injectable()
export class S3Service {
  private s3Client: S3Client;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get("aws.region"),
      credentials: {
        accessKeyId: this.configService.get("aws.accessKeyId"),
        secretAccessKey: this.configService.get("aws.secretAccessKey"),
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    type: S3UploadType = "images",
  ): Promise<string> {
    const bucket = this.configService.get("aws.s3.bucket");
    const uniqueFileName = `${type}/${uuidv4()}-${file.originalname}`;

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: bucket,
        Key: uniqueFileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: this.configService.get("aws.s3.acl"),
      },
    });

    const result = await upload.done();
    return result.Location;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const bucket = this.configService.get("aws.s3.bucket");
    const key = this.extractKeyFromUrl(fileUrl);

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  extractKeyFromUrl(fileUrl: string): string {
    const urlParts = fileUrl.split("/");
    return urlParts.slice(3).join("/");
  }
}
