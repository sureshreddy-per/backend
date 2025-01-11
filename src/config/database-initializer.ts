import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './entities/system-config.entity';
import { SystemConfigKey } from './enums/system-config-key.enum';

@Injectable()
export class DatabaseInitializer implements OnModuleInit {
  constructor(
    @InjectRepository(SystemConfig)
    private readonly systemConfigRepository: Repository<SystemConfig>,
  ) {}

  async onModuleInit() {
    // Wait for a short delay to ensure schema is created
    await new Promise(resolve => setTimeout(resolve, 2000));
    await this.initializeSystemConfigs();
  }

  private async initializeSystemConfigs() {
    const defaultConfigs = [
      {
        key: SystemConfigKey.MAX_DAILY_PRICE_UPDATES,
        value: '3',
        description: 'Maximum number of price updates a buyer can make per day',
      },
      {
        key: SystemConfigKey.MAX_GEOSPATIAL_RADIUS_KM,
        value: '100',
        description: 'Maximum radius in kilometers for geospatial queries',
      },
      {
        key: SystemConfigKey.BASE_FEE_PERCENTAGE,
        value: '2.5',
        description: 'Base fee percentage for transactions',
      },
      {
        key: SystemConfigKey.MIN_INSPECTION_FEE,
        value: '100',
        description: 'Minimum inspection fee in cents',
      },
      {
        key: SystemConfigKey.MAX_INSPECTION_FEE,
        value: '1000',
        description: 'Maximum inspection fee in cents',
      },
      {
        key: SystemConfigKey.INSPECTION_BASE_FEE,
        value: '200',
        description: 'Base fee for inspections',
      },
      {
        key: SystemConfigKey.INSPECTION_FEE_PER_KM,
        value: '5',
        description: 'Fee per kilometer for inspection distance',
      },
    ];

    for (const config of defaultConfigs) {
      const existingConfig = await this.systemConfigRepository.findOne({
        where: { key: config.key },
      });

      if (!existingConfig) {
        await this.systemConfigRepository.save({
          ...config,
          is_active: true,
        });
      }
    }
  }
} 