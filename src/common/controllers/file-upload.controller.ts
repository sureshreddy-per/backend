import {
  Controller,
  Post,
  UseGuards,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Delete,
  Get,
  Query,
  UseInterceptors,
  Param,
  ParseEnumPipe,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiParam, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { FileUploadService } from "../services/file-upload.service";
import { StorageUploadType } from "../services/gcp-storage.service";
import { FileUploadResult } from "../interfaces/file-upload.interface";
import { FileValidationPipe } from "../pipes/file-validation.pipe";
import { ConfigService } from "@nestjs/config";

@ApiTags("File Upload")
@ApiBearerAuth()
@Controller("upload")
@UseGuards(JwtAuthGuard)
export class FileUploadController {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly configService: ConfigService,
  ) {}

  @Post(":type")
  @ApiConsumes("multipart/form-data")
  @ApiParam({
    name: "type",
    enum: StorageUploadType,
    description: "Type of file to upload",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "File uploaded successfully",
    type: FileUploadResult,
  })
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @Param("type", new ParseEnumPipe(StorageUploadType)) type: StorageUploadType,
    @UploadedFile(FileValidationPipe.forType(StorageUploadType.IMAGES)) file: Express.Multer.File,
  ): Promise<FileUploadResult> {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    const result = await this.fileUploadService.uploadFile(file, type);
    return {
      url: result.url,
      filename: result.filename,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  @Post("multiple/:type")
  @ApiConsumes("multipart/form-data")
  @ApiParam({
    name: "type",
    enum: StorageUploadType,
    description: "Type of files to upload",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: {
            type: "string",
            format: "binary",
          },
          maxItems: 5,
          description: "Maximum number of files is configurable via MAX_FILES_PER_REQUEST environment variable",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Files uploaded successfully",
    type: [FileUploadResult],
  })
  @UseInterceptors(FilesInterceptor("files"))
  async uploadMultipleFiles(
    @Param("type", new ParseEnumPipe(StorageUploadType)) type: StorageUploadType,
    @UploadedFiles(FileValidationPipe.forType(StorageUploadType.IMAGES)) files: Express.Multer.File[],
  ): Promise<FileUploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException("No files uploaded");
    }

    const results = await Promise.all(
      files.map((file) => this.fileUploadService.uploadFile(file, type)),
    );

    return results.map((result, index) => ({
      url: result.url,
      filename: result.filename,
      mimetype: files[index].mimetype,
      size: files[index].size,
    }));
  }

  @Delete()
  @ApiQuery({
    name: "filename",
    description: "Name of the file to delete",
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: "File deleted successfully",
  })
  async deleteFile(@Query("filename") filename: string): Promise<{ message: string }> {
    await this.fileUploadService.deleteFile(filename);
    return { message: "File deleted successfully" };
  }

  @Get("signed-url")
  @ApiQuery({
    name: "filename",
    description: "Name of the file to generate signed URL for",
    required: true,
  })
  @ApiQuery({
    name: "expiresIn",
    description: "Number of minutes until the signed URL expires",
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Signed URL generated successfully",
    schema: {
      type: "object",
      properties: {
        signedUrl: {
          type: "string",
          example: "https://storage.googleapis.com/bucket/file.jpg?signature=...",
        },
      },
    },
  })
  async getSignedUrl(
    @Query("filename") filename: string,
    @Query("expiresIn") expiresIn?: number,
  ): Promise<{ signedUrl: string }> {
    const signedUrl = await this.fileUploadService.generateSignedUrl(
      filename,
      expiresIn,
    );
    return { signedUrl };
  }
}
