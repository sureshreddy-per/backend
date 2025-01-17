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

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    TypeOrmModule.forFeature([QualityAssessment, InspectionRequest]),
    forwardRef(() => ProduceModule),
  ],
  providers: [
    {
      provide: OpenAIService,
      useFactory: (configService: ConfigService, httpService: HttpService) => {
        const useMockService = configService.get<boolean>('USE_MOCK_AI_SERVICE', false);
        return useMockService ? new MockOpenAIService(configService, httpService) : new OpenAIService(configService, httpService);
      },
      inject: [ConfigService, HttpService],
    },
    QualityAssessmentService,
    InspectionRequestService,
  ],
  controllers: [QualityController],
  exports: [OpenAIService, QualityAssessmentService],
})
export class QualityModule {}
