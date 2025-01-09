import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionDistanceFeeConfig } from './entities/fee-config.entity';
import { InspectionBaseFeeConfig } from './entities/base-fee-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InspectionDistanceFeeConfig,
      InspectionBaseFeeConfig
    ])
  ],
  exports: [TypeOrmModule]
})
export class ConfigModule {} 