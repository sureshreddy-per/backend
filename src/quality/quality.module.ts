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
import { MockAIService } from "./services/mock-ai.service";
import { AIInspectionService } from "./services/ai-inspection.service";
import { HttpModule, HttpService } from "@nestjs/axios";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    TypeOrmModule.forFeature([QualityAssessment, InspectionRequest]),
    ProduceModule,
    forwardRef(() => OffersModule),
    HttpModule,
    ConfigModule,
  ],
  controllers: [QualityController, FeeController],
  providers: [
    QualityAssessmentService,
    InspectionFeeService,
    AIInspectionService,
    {
      provide: OpenAIService,
      useFactory: (configService: ConfigService, httpService: HttpService) => {
        const env = configService.get<string>('NODE_ENV');
        return env === 'development' ? new MockAIService() : new OpenAIService(configService, httpService);
      },
      inject: [ConfigService, HttpService],
    },
  ],
  exports: [
    QualityAssessmentService,
    InspectionFeeService,
    OpenAIService,
    AIInspectionService,
  ],
})
export class QualityModule {}
