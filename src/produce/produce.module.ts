import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProduceService } from './produce.service';
import { ProduceController } from './produce.controller';
import { Produce } from './entities/produce.entity';
import { QualityModule } from '../quality/quality.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Produce]),
    QualityModule,
    CustomersModule,
  ],
  providers: [ProduceService],
  controllers: [ProduceController],
  exports: [ProduceService],
})
export class ProduceModule {} 