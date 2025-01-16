import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { OpenAIService } from './services/openai.service';
import { MockOpenAIService } from './services/mock-openai.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
  ],
  providers: [
    {
      provide: OpenAIService,
      useClass: process.env.NODE_ENV === 'test' ? MockOpenAIService : OpenAIService,
    },
  ],
  exports: [OpenAIService],
})
export class QualityModule {}
