import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { Support } from './entities/support.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { FileUploadService } from '../common/services/file-upload.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Support]),
    NotificationsModule,
  ],
  controllers: [SupportController],
  providers: [SupportService, FileUploadService],
  exports: [SupportService],
})
export class SupportModule {} 