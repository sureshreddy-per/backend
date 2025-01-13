import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { QualityAssessment } from "./entities/quality-assessment.entity";
import { QualityAssessmentService } from "./services/quality-assessment.service";
import { QualityController } from "./quality.controller";
import { AIInspectionService } from "./services/ai-inspection.service";
import { OpenAIService } from "./services/openai.service";
import { InspectionRequest } from "./entities/inspection-request.entity";
import { InspectionRequestService } from "./services/inspection-request.service";
import { ConfigModule } from "@nestjs/config";
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
    OpenAIService,
    InspectionRequestService,
  ],
  exports: [QualityAssessmentService, AIInspectionService, InspectionRequestService],
})
export class QualityModule {}
