import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionDistanceFeeService } from './services/fee-config.service';
import { InspectionDistanceFeeConfig } from './entities/fee-config.entity';
import { InspectionDistanceFeeController } from './controllers/fee-config.controller';
import { SystemConfigService } from './services/system-config.service';
import { SystemConfig } from './entities/system-config.entity';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forFeature([InspectionDistanceFeeConfig, SystemConfig]),
  ],
  controllers: [InspectionDistanceFeeController],
  providers: [InspectionDistanceFeeService, SystemConfigService],
  exports: [InspectionDistanceFeeService, SystemConfigService],
})
export class ConfigModule {}
