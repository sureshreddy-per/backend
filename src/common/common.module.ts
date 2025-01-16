import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { FileUploadController } from "./controllers/file-upload.controller";
import { FileUploadService } from "./services/file-upload.service";
import { GcpStorageService } from "./services/gcp-storage.service";

@Module({
  imports: [ConfigModule],
  controllers: [FileUploadController],
  providers: [FileUploadService, GcpStorageService],
  exports: [FileUploadService, GcpStorageService],
})
export class CommonModule {}
