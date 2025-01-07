import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './entities';
import { MediaService } from './services/media.service';
import { MediaProcessorService } from './services/media-processor.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media]),
    CommonModule,
  ],
  providers: [MediaService, MediaProcessorService],
  exports: [MediaService],
})
export class MediaModule {} 