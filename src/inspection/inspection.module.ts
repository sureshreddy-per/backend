import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionService } from './inspection.service';
import { InspectionController } from './inspection.controller';
import { Inspection } from './entities/inspection.entity';
import { Produce } from '../produce/entities/produce.entity';
import { QualityAssessment } from '../quality/entities/quality-assessment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inspection,
      Produce,
      QualityAssessment
    ])
  ],
  controllers: [InspectionController],
  providers: [InspectionService],
  exports: [InspectionService]
})
export class InspectionModule {} 