import { Controller, Post, UseInterceptors, UploadedFile, Get, Param, Delete, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from '../services/media.service';
import { FileUploadInterceptor } from '../../common/interceptors/file-upload.interceptor';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('media')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly configService: ConfigService,
  ) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
      fileFilter: (req, file, cb) => {
        // Allow all file types, FileValidator will handle type validation
        cb(null, true);
      },
    }),
    FileUploadInterceptor,
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.mediaService.uploadFile(file);
  }

  @Get(':id')
  async getFile(@Param('id') id: string) {
    return this.mediaService.getFile(id);
  }

  @Delete(':id')
  async deleteFile(@Param('id') id: string) {
    return this.mediaService.deleteFile(id);
  }
}