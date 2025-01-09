import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualityAssessment } from './entities/quality-assessment.entity';
import { QualityAssessmentService } from './services/quality-assessment.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProduceModule } from '../produce/produce.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QualityAssessment]),
    NotificationsModule,
    ProduceModule,
  ],
  providers: [
    QualityAssessmentService,
  ],
  exports: [QualityAssessmentService],
})
export class QualityModule {} 