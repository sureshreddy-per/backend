import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { S3Service } from "./services/s3.service";
import { GcpStorageService } from "./services/gcp-storage.service";
import { GeospatialService } from "./services/geospatial.service";
import { FileUploadInterceptor } from "./interceptors/file-upload.interceptor";
import { FileValidator } from "./validators/file.validator";
import { StorageServiceProvider, STORAGE_SERVICE } from "./providers/storage.provider";

@Module({
  imports: [ConfigModule],
  providers: [
    S3Service,
    GcpStorageService,
    GeospatialService,
    FileUploadInterceptor,
    FileValidator,
    StorageServiceProvider,
  ],
  exports: [
    S3Service,
    GcpStorageService,
    GeospatialService,
    FileUploadInterceptor,
    FileValidator,
    STORAGE_SERVICE,
  ],
})
export class CommonModule {}
