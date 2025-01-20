import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { SystemConfig } from "../entities/system-config.entity";
import { SystemConfigKey } from "../enums/system-config-key.enum";

@Injectable()
export class SystemConfigService implements OnModuleInit {
  constructor(
    @InjectRepository(SystemConfig)
    private readonly systemConfigRepository: Repository<SystemConfig>,
    private readonly dataSource: DataSource
  ) {}

  async onModuleInit() {
    await this.initializeDefaultConfigs();
  }

  private async initializeDefaultConfigs(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const defaultConfigs = [
        {
          key: SystemConfigKey.MAX_DAILY_PRICE_UPDATES,
          value: process.env.MAX_DAILY_PRICE_UPDATES || "2",
          description: "Maximum number of price updates allowed per day",
        },
        {
          key: SystemConfigKey.MAX_GEOSPATIAL_RADIUS_KM,
          value: process.env.MAX_GEOSPATIAL_RADIUS_KM || "50",
          description: "Maximum radius in kilometers for geospatial queries",
        },
        {
          key: SystemConfigKey.BASE_FEE_PERCENTAGE,
          value: process.env.BASE_FEE_PERCENTAGE || "2",
          description: "Base fee percentage for transactions",
        },
        {
          key: SystemConfigKey.MIN_INSPECTION_FEE,
          value: process.env.MIN_INSPECTION_FEE || "100",
          description: "Minimum inspection fee in rupees",
        },
        {
          key: SystemConfigKey.MAX_INSPECTION_FEE,
          value: process.env.MAX_INSPECTION_FEE || "5000",
          description: "Maximum inspection fee in rupees",
        },
        {
          key: SystemConfigKey.INSPECTION_BASE_FEE,
          value: process.env.INSPECTION_BASE_FEE || "500",
          description: "Base inspection fee in rupees",
        },
        {
          key: SystemConfigKey.INSPECTION_FEE_PER_KM,
          value: process.env.INSPECTION_FEE_PER_KM || "5",
          description: "Inspection fee per kilometer in rupees",
        },
      ];

      for (const config of defaultConfigs) {
        const existingConfig = await queryRunner.manager.findOne(SystemConfig, {
          where: { key: config.key },
        });

        if (!existingConfig) {
          const newConfig = queryRunner.manager.create(SystemConfig, {
            ...config,
            is_active: true,
          });
          await queryRunner.manager.save(SystemConfig, newConfig);
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      console.error('Failed to initialize default configs:', error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getValue(key: SystemConfigKey): Promise<string | number> {
    const config = await this.systemConfigRepository.findOne({
      where: { key },
    });
    if (!config) return null;

    // Convert to number if it's a numeric value
    const numericKeys = [
      SystemConfigKey.MAX_DAILY_PRICE_UPDATES,
      SystemConfigKey.MAX_GEOSPATIAL_RADIUS_KM,
      SystemConfigKey.BASE_FEE_PERCENTAGE,
      SystemConfigKey.MIN_INSPECTION_FEE,
      SystemConfigKey.MAX_INSPECTION_FEE,
      SystemConfigKey.INSPECTION_BASE_FEE,
      SystemConfigKey.INSPECTION_FEE_PER_KM,
    ];

    return numericKeys.includes(key) ? Number(config.value) : config.value;
  }

  async setValue(key: SystemConfigKey, value: any): Promise<void> {
    await this.systemConfigRepository.update(
      { key },
      { value: value.toString() },
    );
  }

  async getAllConfigs(): Promise<SystemConfig[]> {
    return this.systemConfigRepository.find();
  }

  async updateValue(key: SystemConfigKey, value: string, description?: string): Promise<void> {
    const updateData: any = { value };
    if (description) {
      updateData.description = description;
    }
    await this.systemConfigRepository.update({ key }, updateData);
  }
}
