import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProduceService } from './services/produce.service';
import { ProduceController } from './produce.controller';
import { Produce } from './entities/produce.entity';
import { Synonym } from './entities/synonym.entity';
import { FarmersModule } from '../farmers/farmers.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Produce, Synonym]),
    FarmersModule,
    CommonModule,
  ],
  controllers: [ProduceController],
  providers: [ProduceService],
  exports: [ProduceService],
})
export class ProduceModule {} 