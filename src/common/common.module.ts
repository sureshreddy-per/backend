import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BaseService } from './base.service';
import { BaseController } from './base.controller';
import { FileUploadService } from './services/file-upload.service';
import { FileUploadController } from './controllers/file-upload.controller';
import { S3Service } from './services/s3.service';
import { GeospatialService } from './services/geospatial.service';

@Module({
  imports: [ConfigModule],
  controllers: [BaseController, FileUploadController],
  providers: [BaseService, FileUploadService, S3Service, GeospatialService],
  exports: [BaseService, FileUploadService, S3Service, GeospatialService]
})
export class CommonModule {} 