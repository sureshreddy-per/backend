import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProduceController } from './produce.controller';
import { ProduceService } from './services/produce.service';
import { Produce } from './entities/produce.entity';
import { ProduceSynonymService } from './services/synonym.service';
import { ProduceSynonym } from './entities/synonym.entity';
import { FarmersModule } from '../farmers/farmers.module';
import { ProduceSynonymController } from './controllers/synonym.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Produce, ProduceSynonym]),
    FarmersModule
  ],
  controllers: [ProduceController, ProduceSynonymController],
  providers: [ProduceService, ProduceSynonymService],
  exports: [ProduceService]
})
export class ProduceModule {} 