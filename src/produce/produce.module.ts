import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Produce } from './entities/produce.entity';
import { ProduceService } from './services/produce.service';
import { ProduceController } from './produce.controller';
import { ProduceSynonym } from './entities/synonym.entity';
import { ProduceSynonymService } from './services/synonym.service';
import { ProduceSynonymController } from './controllers/synonym.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Produce, ProduceSynonym])
  ],
  controllers: [ProduceController, ProduceSynonymController],
  providers: [ProduceService, ProduceSynonymService],
  exports: [ProduceService, ProduceSynonymService]
})
export class ProduceModule {} 