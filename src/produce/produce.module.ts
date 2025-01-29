import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ProduceController } from './produce.controller';
import { ProduceService } from './services/produce.service';
import { ProduceSynonymService } from './services/synonym.service';
import { ProduceSynonymController } from './controllers/synonym.controller';
import { Produce } from './entities/produce.entity';
import { Synonym } from './entities/synonym.entity';
import { AiSynonymService } from './services/ai-synonym.service';
import { MockAiSynonymService } from './services/mock-ai-synonym.service';
import { LanguageService } from '../config/language.service';
import { FarmersModule } from '../farmers/farmers.module';
import { InspectionDistanceFeeService } from '../config/services/fee-config.service';
import { InspectorsModule } from '../inspectors/inspectors.module';
import { ConfigModule } from '../config/config.module';
import { CommonModule } from '../common/common.module';
import { QualityModule } from '../quality/quality.module';
import { ProduceMaster } from './entities/produce-master.entity';
import { ProduceMasterService } from './services/produce-master.service';
import { ProduceMasterController } from './controllers/produce-master.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Produce,
      Synonym,
      ProduceMaster,
    ]),
    NestConfigModule,
    ConfigModule,
    HttpModule,
    FarmersModule,
    InspectorsModule,
    CommonModule,
    QualityModule,
  ],
  controllers: [ProduceController, ProduceSynonymController, ProduceMasterController],
  providers: [
    ProduceService,
    ProduceSynonymService,
    ProduceMasterService,
    LanguageService,
    {
      provide: AiSynonymService,
      useFactory: (configService: ConfigService, httpService: HttpService, languageService: LanguageService) => {
        const useMockService = configService.get('USE_MOCK_AI_SERVICE') === 'true';
        return useMockService ? 
          new MockAiSynonymService(languageService) : 
          new AiSynonymService(configService, httpService);
      },
      inject: [ConfigService, HttpService, LanguageService],
    },
  ],
  exports: [ProduceService, ProduceSynonymService, ProduceMasterService],
})
export class ProduceModule {}
