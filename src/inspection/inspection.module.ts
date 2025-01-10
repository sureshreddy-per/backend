import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionController } from './controllers/inspection.controller';
import { InspectionFeeController } from './controllers/inspection-fee.controller';
import { InspectionService } from './services/inspection.service';
import { InspectionFeeService } from './services/inspection-fee.service';
import { InspectionRequest } from './entities/inspection-request.entity';
import { InspectionBaseFeeConfig } from '../config/entities/base-fee-config.entity';
import { InspectionDistanceFeeConfig } from '../config/entities/fee-config.entity';
import { QualityModule } from '../quality/quality.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProduceModule } from '../produce/produce.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InspectionRequest,
      InspectionBaseFeeConfig,
      InspectionDistanceFeeConfig,
    ]),
    QualityModule,
    NotificationsModule,
    ProduceModule,
    ConfigModule,
  ],
  controllers: [InspectionController, InspectionFeeController],
  providers: [
    InspectionService,
    InspectionFeeService,
  ],
  exports: [InspectionService, InspectionFeeService],
})
export class InspectionModule {} 