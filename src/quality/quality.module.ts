import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QualityController } from "./quality.controller";
import { QualityAssessment } from "./entities/quality-assessment.entity";
import { QualityAssessmentService } from "./services/quality-assessment.service";
import { InspectionRequest } from "./entities/inspection-request.entity";
import { ProduceModule } from "../produce/produce.module";
import { InspectionFeeService } from "./services/inspection-fee.service";
import { FeeController } from "./controllers/fee.controller";
import { OffersModule } from "../offers/offers.module";
import { OpenAIService } from "./services/openai.service";
import { AIInspectionService } from "./services/ai-inspection.service";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { CacheModule } from "@nestjs/cache-manager";
import { EventEmitterModule } from "@nestjs/event-emitter";

@Module({
  imports: [
    TypeOrmModule.forFeature([QualityAssessment, InspectionRequest]),
    ProduceModule,
    forwardRef(() => OffersModule),
    HttpModule,
    ConfigModule,
    CacheModule.register(),
    EventEmitterModule.forRoot()
  ],
  controllers: [QualityController, FeeController],
  providers: [
    QualityAssessmentService,
    InspectionFeeService,
    AIInspectionService,
    OpenAIService,
  ],
  exports: [
    QualityAssessmentService,
    InspectionFeeService,
    OpenAIService,
    AIInspectionService,
    TypeOrmModule,
  ],
})
export class QualityModule {}
