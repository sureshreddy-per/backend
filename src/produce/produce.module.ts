import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Produce } from './entities/produce.entity';
import { Synonym } from './entities/synonym.entity';
import { ProduceService } from './services/produce.service';
import { ProduceSynonymService } from './services/synonym.service';
import { ProduceController } from './produce.controller';
import { ConfigModule } from '@nestjs/config';
import { FarmersModule } from '../farmers/farmers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Produce, Synonym]),
    ConfigModule,
    FarmersModule,
  ],
  providers: [ProduceService, ProduceSynonymService],
  controllers: [ProduceController],
  exports: [ProduceService, ProduceSynonymService],
})
export class ProduceModule {}
