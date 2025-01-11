import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { promises as fs } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class FileUploadService {
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>("UPLOAD_DIR") || "uploads";
    this.ensureUploadDirExists();
  }

  private async ensureUploadDirExists() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    const fileExtension = file.originalname.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = join(this.uploadDir, fileName);

    try {
      await fs.writeFile(filePath, file.buffer);
      return fileName;
    } catch (error) {
      throw new BadRequestException("Failed to save file");
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    const filePath = join(this.uploadDir, fileName);

    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
    } catch (error) {
      throw new BadRequestException("File not found or could not be deleted");
    }
  }

  async getFilePath(fileName: string): Promise<string> {
    const filePath = join(this.uploadDir, fileName);

    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      throw new BadRequestException("File not found");
    }
  }
}
