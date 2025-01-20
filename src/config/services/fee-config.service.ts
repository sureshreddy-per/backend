import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { InspectionDistanceFeeConfig } from "../entities/fee-config.entity";

@Injectable()
export class InspectionDistanceFeeService {
  private readonly logger = new Logger(InspectionDistanceFeeService.name);
  private cachedConfig: InspectionDistanceFeeConfig | null = null;

  constructor(
    @InjectRepository(InspectionDistanceFeeConfig)
    private readonly inspectionDistanceFeeRepository: Repository<InspectionDistanceFeeConfig>,
    private readonly dataSource: DataSource
  ) {
    this.initializeWithRetry();
  }

  private async initializeWithRetry(retries = 3): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.logger.log(`Attempting to initialize fee config (attempt ${attempt}/${retries})`);
        await this.initializeCache();
        this.logger.log('Successfully initialized fee config');
        return;
      } catch (error) {
        this.logger.error(`Failed to initialize fee config on attempt ${attempt}: ${error.message}`);
        if (attempt === retries) {
          this.logger.error('Max retries reached, initialization failed');
          return;
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  private async initializeCache(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.cachedConfig = await queryRunner.manager.findOne(InspectionDistanceFeeConfig, {
        where: { is_active: true },
        order: { created_at: "DESC" },
      });

      if (!this.cachedConfig) {
        // Create default config if none exists
        const defaultConfig = queryRunner.manager.create(InspectionDistanceFeeConfig, {
          fee_per_km: parseInt(process.env.DEFAULT_FEE_PER_KM || '10'),
          max_distance_fee: parseInt(process.env.DEFAULT_MAX_DISTANCE_FEE || '500'),
          is_active: true,
        });

        this.cachedConfig = await queryRunner.manager.save(defaultConfig);
        this.logger.log('Created default fee config');
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      this.logger.error('Failed to initialize fee config cache', error.stack);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getActiveConfig(): Promise<InspectionDistanceFeeConfig | null> {
    return this.inspectionDistanceFeeRepository.findOne({
      where: { is_active: true },
      order: { created_at: "DESC" },
    });
  }

  async updateConfig(
    feePerKm: number,
    maxDistanceFee: number,
    updatedBy: string,
  ): Promise<InspectionDistanceFeeConfig> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Deactivate current config
      if (this.cachedConfig) {
        this.cachedConfig.is_active = false;
        await queryRunner.manager.save(this.cachedConfig);
      }

      // Create new config
      const newConfig = queryRunner.manager.create(InspectionDistanceFeeConfig, {
        fee_per_km: feePerKm,
        max_distance_fee: maxDistanceFee,
        is_active: true,
        updated_by: updatedBy,
      });

      const savedConfig = await queryRunner.manager.save(newConfig);
      await queryRunner.commitTransaction();

      // Update cache
      this.cachedConfig = savedConfig;

      return savedConfig;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  getDistanceFee(distance: number): number {
    if (!this.cachedConfig) {
      // Use default values if config not available
      const defaultFeePerKm = parseInt(process.env.DEFAULT_FEE_PER_KM || '10');
      const defaultMaxFee = parseInt(process.env.DEFAULT_MAX_DISTANCE_FEE || '500');
      return Math.min(distance * defaultFeePerKm, defaultMaxFee);
    }

    return Math.min(
      distance * this.cachedConfig.fee_per_km,
      this.cachedConfig.max_distance_fee,
    );
  }
}
