import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SystemConfig } from './entities/system-config.entity';
import { SystemConfigKey } from './enums/system-config-key.enum';

@Injectable()
export class DatabaseInitializer implements OnModuleInit {
  constructor(
    @InjectRepository(SystemConfig)
    private readonly systemConfigRepository: Repository<SystemConfig>,
    private readonly dataSource: DataSource
  ) {}

  async onModuleInit() {
    // Drop all existing enum types first
    await this.dropEnumTypes();
    await this.initializeSystemConfigs();
  }

  private async dropEnumTypes() {
    try {
      await this.dataSource.query(`
        DO $$ 
        DECLARE 
          enum_type text;
        BEGIN 
          FOR enum_type IN (SELECT t.typname 
                           FROM pg_type t 
                           JOIN pg_enum e ON t.oid = e.enumtypid 
                           GROUP BY t.typname) 
          LOOP 
            EXECUTE 'DROP TYPE IF EXISTS ' || enum_type || ' CASCADE'; 
          END LOOP; 
        END $$;
      `);
    } catch (error) {
      console.error('Error dropping enum types:', error);
    }
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
      await this.systemConfigRepository.save({
        ...config,
        is_active: true,
      });
    }
  }
} 