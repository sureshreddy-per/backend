import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualityService } from './quality.service';
import { QualityController } from './quality.controller';
import { Quality } from './entities/quality.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Quality])],
  providers: [QualityService],
  controllers: [QualityController],
  exports: [QualityService],
})
export class QualityModule {} 