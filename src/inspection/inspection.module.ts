import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { InspectionService } from './inspection.service';
import { InspectionController } from './inspection.controller';
import { MonitoringController } from './controllers/monitoring.controller';
import { Inspection } from './entities/inspection.entity';
import { User } from '../auth/entities/user.entity';
import { Produce } from '../produce/entities/produce.entity';
import { Quality } from '../quality/entities/quality.entity';
import { AuthModule } from '../auth/auth.module';
import { InspectionExceptionFilter } from './filters/inspection-exception.filter';
import { TensorFlowAIService } from './services/tensorflow-ai.service';
import { AIValidationService } from './services/ai-validation.service';
import { BatchProcessorService } from './services/batch-processor.service';
import { SystemMonitorService } from './services/system-monitor.service';
import { AlertService } from './services/alert.service';
import { BenchmarkService } from './services/benchmark.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inspection, User, Produce, Quality]),
    AuthModule,
    EventEmitterModule.forRoot(),
    ConfigModule,
  ],
  providers: [
    InspectionService,
    TensorFlowAIService,
    AIValidationService,
    BatchProcessorService,
    SystemMonitorService,
    AlertService,
    BenchmarkService,
    {
      provide: APP_FILTER,
      useClass: InspectionExceptionFilter,
    },
  ],
  controllers: [InspectionController, MonitoringController],
  exports: [
    InspectionService,
    TensorFlowAIService,
    SystemMonitorService,
    AlertService,
    BenchmarkService,
  ],
})
export class InspectionModule {} 