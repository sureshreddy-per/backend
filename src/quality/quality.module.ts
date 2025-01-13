import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QualityController } from "./quality.controller";
import { QualityAssessment } from "./entities/quality-assessment.entity";
import { QualityAssessmentService } from "./services/quality-assessment.service";
import { OpenAIService } from "./services/openai.service";
import { MockOpenAIService } from "./services/mock-openai.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { HttpModule, HttpService } from "@nestjs/axios";
import { ProduceModule } from "../produce/produce.module";
import { CacheModule } from "@nestjs/cache-manager";
import { InspectionRequest } from "./entities/inspection-request.entity";
import { InspectionRequestService } from "./services/inspection-request.service";
import { AIInspectionService } from "./services/ai-inspection.service";
import { EventEmitterModule } from "@nestjs/event-emitter";

@Module({
  imports: [
    TypeOrmModule.forFeature([QualityAssessment, InspectionRequest]),
    ProduceModule,
    HttpModule,
    ConfigModule,
    EventEmitterModule.forRoot(),
    CacheModule.register(),
  ],
  controllers: [QualityController],
  providers: [
    QualityAssessmentService,
    InspectionRequestService,
    AIInspectionService,
    {
      provide: OpenAIService,
      useFactory: (configService: ConfigService, httpService: HttpService) => {
        const env = configService.get<string>('NODE_ENV');
        return env === 'development' ? new MockOpenAIService(configService, httpService) : new OpenAIService(configService, httpService);
      },
      inject: [ConfigService, HttpService],
    },
  ],
  exports: [QualityAssessmentService],
})
export class QualityModule {}
