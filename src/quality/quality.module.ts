import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualityAssessment } from './entities/quality-assessment.entity';
import { QualityAssessmentService } from './services/quality-assessment.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProduceModule } from '../produce/produce.module';
import { QualityController } from './quality.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([QualityAssessment]),
    NotificationsModule,
    ProduceModule,
  ],
  controllers: [QualityController],
  providers: [
    QualityAssessmentService,
  ],
  exports: [QualityAssessmentService],
})
export class QualityModule {} 