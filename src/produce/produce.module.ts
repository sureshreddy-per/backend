import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([Produce, Synonym]),
    NestConfigModule,
    ConfigModule,
    HttpModule,
    FarmersModule,
    InspectorsModule,
  ],
  controllers: [ProduceController, ProduceSynonymController],
  providers: [
    ProduceService,
    ProduceSynonymService,
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
  exports: [ProduceService, ProduceSynonymService, TypeOrmModule],
})
export class ProduceModule {}
