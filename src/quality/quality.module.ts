import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule, HttpService } from "@nestjs/axios";
import { QualityAssessment } from "./entities/quality-assessment.entity";
import { QualityAssessmentService } from "./services/quality-assessment.service";
import { QualityController } from "./quality.controller";
import { AIInspectionService } from "./services/ai-inspection.service";
import { OpenAIService } from "./services/openai.service";
import { MockOpenAIService } from "./services/mock-openai.service";
import { InspectionRequest } from "./entities/inspection-request.entity";
import { InspectionRequestService } from "./services/inspection-request.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Produce } from "../produce/entities/produce.entity";
import { ProduceModule } from "../produce/produce.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([QualityAssessment, InspectionRequest, Produce]),
    ConfigModule,
    HttpModule,
    ProduceModule,
  ],
  controllers: [QualityController],
  providers: [
    QualityAssessmentService,
    AIInspectionService,
    InspectionRequestService,
    {
      provide: OpenAIService,
      useFactory: (configService: ConfigService, httpService: HttpService) => {
        return new MockOpenAIService(configService, httpService);
      },
      inject: [ConfigService, HttpService],
    },
  ],
  exports: [QualityAssessmentService, AIInspectionService, InspectionRequestService],
})
export class QualityModule {}
