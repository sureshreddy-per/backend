import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualityService } from './quality.service';
import { QualityController } from './quality.controller';
import { QualityAssessment } from './entities/quality-assessment.entity';
import { AIInspectionService } from './services/ai-inspection.service';
import { OpenAIService } from './services/openai.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    TypeOrmModule.forFeature([QualityAssessment]),
    EventEmitterModule.forRoot()
  ],
  controllers: [QualityController],
  providers: [
    QualityService,
    AIInspectionService,
    OpenAIService
  ],
  exports: [QualityService, AIInspectionService]
})
export class QualityModule {} 