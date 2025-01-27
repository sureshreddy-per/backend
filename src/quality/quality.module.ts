import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule, HttpService } from '@nestjs/axios';
import { OpenAIService } from './services/openai.service';
import { MockOpenAIService } from './services/mock-openai.service';
import { QualityController } from './quality.controller';
import { QualityAssessmentService } from './services/quality-assessment.service';
import { InspectionRequestService } from './services/inspection-request.service';
import { AutoInspectorAssignmentService } from './services/auto-inspector-assignment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualityAssessment } from './entities/quality-assessment.entity';
import { InspectionRequest } from './entities/inspection-request.entity';
import { ProduceModule } from '../produce/produce.module';
import { Produce } from "../produce/entities/produce.entity";
import { Inspector } from "../inspectors/entities/inspector.entity";
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InspectorsModule } from '../inspectors/inspectors.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    TypeOrmModule.forFeature([
      QualityAssessment,
      InspectionRequest,
      Produce,
      Inspector
    ]),
    forwardRef(() => ProduceModule),
    InspectorsModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: OpenAIService,
      useFactory: (
        configService: ConfigService,
        httpService: HttpService,
        qualityAssessmentService: QualityAssessmentService,
        produceRepository: Repository<Produce>
      ) => {
        const useMockService = configService.get('USE_MOCK_AI_SERVICE') === 'true';
        console.log('USE_MOCK_AI_SERVICE:', configService.get('USE_MOCK_AI_SERVICE'));
        console.log('Using mock service:', useMockService);
        return useMockService
          ? new MockOpenAIService(configService, httpService, qualityAssessmentService, produceRepository)
          : new OpenAIService(configService, httpService, qualityAssessmentService);
      },
      inject: [
        ConfigService,
        HttpService,
        QualityAssessmentService,
        getRepositoryToken(Produce)
      ],
    },
    QualityAssessmentService,
    InspectionRequestService,
    AutoInspectorAssignmentService,
  ],
  controllers: [QualityController],
  exports: [OpenAIService, QualityAssessmentService, InspectionRequestService],
})
export class QualityModule {}
