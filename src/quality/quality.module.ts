import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualityService } from './quality.service';
import { QualityController } from './quality.controller';
import { QualityAssessment } from './entities/quality-assessment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QualityAssessment])],
  controllers: [QualityController],
  providers: [QualityService],
  exports: [QualityService]
})
export class QualityModule {} 