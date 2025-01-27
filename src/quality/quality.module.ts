import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule, HttpService } from '@nestjs/axios';
import { OpenAIService } from './services/openai.service';
import { MockOpenAIService } from './services/mock-openai.service';
import { QualityController } from './quality.controller';
import { QualityAssessmentService } from './services/quality-assessment.service';
import { InspectionRequestService } from './services/inspection-request.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualityAssessment } from './entities/quality-assessment.entity';
import { InspectionRequest } from './entities/inspection-request.entity';
import { ProduceModule } from '../produce/produce.module';
import { Produce } from "../produce/entities/produce.entity";
import { Inspector } from "../inspectors/entities/inspector.entity";

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
  ],
  providers: [
    {
      provide: OpenAIService,
      useFactory: (configService: ConfigService, httpService: HttpService, qualityAssessmentService: QualityAssessmentService) => {
        // Read directly from environment variable
        const useMockService = process.env.USE_MOCK_AI_SERVICE === 'true';
        console.log('USE_MOCK_AI_SERVICE:', process.env.USE_MOCK_AI_SERVICE);
        console.log('Using mock service:', useMockService);
        return useMockService 
          ? new MockOpenAIService(configService, httpService, qualityAssessmentService) 
          : new OpenAIService(configService, httpService, qualityAssessmentService);
      },
      inject: [ConfigService, HttpService, QualityAssessmentService],
    },
    QualityAssessmentService,
    InspectionRequestService,
  ],
  controllers: [QualityController],
  exports: [OpenAIService, QualityAssessmentService, InspectionRequestService],
})
export class QualityModule {}
