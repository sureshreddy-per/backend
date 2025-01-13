import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QualityController } from "./quality.controller";
import { QualityAssessmentService } from "./services/quality-assessment.service";
import { QualityAssessment } from "./entities/quality-assessment.entity";
import { InspectionRequest } from "./entities/inspection-request.entity";
import { InspectionRequestService } from "./services/inspection-request.service";
import { InspectionFeeService } from "../config/services/inspection-fee.service";
import { AIInspectionService } from "./services/ai-inspection.service";
import { OpenAIService } from "./services/openai.service";
import { ProduceModule } from "../produce/produce.module";
import { CacheModule } from "@nestjs/cache-manager";
import { HttpModule, HttpService } from "@nestjs/axios";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MockOpenAIService } from "./services/mock-openai.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([QualityAssessment, InspectionRequest]),
    ProduceModule,
    CacheModule.register(),
    HttpModule,
    ConfigModule,
  ],
  controllers: [QualityController],
  providers: [
    QualityAssessmentService,
    InspectionRequestService,
    InspectionFeeService,
    AIInspectionService,
    {
      provide: OpenAIService,
      useFactory: (configService: ConfigService, httpService: HttpService) => {
        const env = configService.get<string>('NODE_ENV');
        return env === 'development' ? new MockOpenAIService() : new OpenAIService(configService, httpService);
      },
      inject: [ConfigService, HttpService],
    },
  ],
  exports: [QualityAssessmentService, InspectionRequestService],
})
export class QualityModule {}
