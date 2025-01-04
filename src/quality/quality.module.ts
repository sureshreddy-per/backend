import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualityService } from './quality.service';
import { QualityController } from './quality.controller';
import { Quality } from './entities/quality.entity';
import { AIInspectionService } from './services/ai-inspection.service';
import { OpenAIService } from './services/openai.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quality]),
    EventEmitterModule.forRoot(),
    ConfigModule,
  ],
  providers: [QualityService, AIInspectionService, OpenAIService],
  controllers: [QualityController],
  exports: [QualityService],
})
export class QualityModule {} 