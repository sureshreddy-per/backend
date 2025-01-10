import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionDistanceFeeConfig } from './entities/fee-config.entity';
import { InspectionBaseFeeConfig } from './entities/base-fee-config.entity';
import { InspectionBaseFeeController } from './controllers/base-fee-config.controller';
import { InspectionDistanceFeeController } from './controllers/fee-config.controller';
import { InspectionBaseFeeService } from './services/base-fee-config.service';
import { InspectionDistanceFeeService } from './services/fee-config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InspectionDistanceFeeConfig,
      InspectionBaseFeeConfig
    ])
  ],
  controllers: [
    InspectionBaseFeeController,
    InspectionDistanceFeeController
  ],
  providers: [
    InspectionBaseFeeService,
    InspectionDistanceFeeService
  ],
  exports: [
    InspectionBaseFeeService,
    InspectionDistanceFeeService
  ]
})
export class ConfigModule {} 