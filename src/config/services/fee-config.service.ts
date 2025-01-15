import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InspectionDistanceFeeConfig } from "../entities/fee-config.entity";

@Injectable()
export class InspectionDistanceFeeService {
  private readonly logger = new Logger(InspectionDistanceFeeService.name);
  private cachedConfig: InspectionDistanceFeeConfig | null = null;

  constructor(
    @InjectRepository(InspectionDistanceFeeConfig)
    private readonly inspectionDistanceFeeRepository: Repository<InspectionDistanceFeeConfig>,
  ) {
    this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
    try {
      this.cachedConfig = await this.getActiveConfig();

      if (!this.cachedConfig) {
        // Create default config if none exists
        this.cachedConfig = await this.createDefaultConfig();
      }
    } catch (error) {
      this.logger.error(
        "Failed to initialize inspection distance fee config cache",
        error.stack,
      );
    }
  }

  private async createDefaultConfig(): Promise<InspectionDistanceFeeConfig> {
    const defaultConfig = this.inspectionDistanceFeeRepository.create({
      fee_per_km: 5, // Default ₹5 per km
      max_distance_fee: 500, // Default max ₹500
      is_active: true,
    });

    return this.inspectionDistanceFeeRepository.save(defaultConfig);
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
    // Deactivate current config
    if (this.cachedConfig) {
      await this.inspectionDistanceFeeRepository.update(
        { id: this.cachedConfig.id },
        { is_active: false },
      );
    }

    // Create new config
    const newConfig = this.inspectionDistanceFeeRepository.create({
      fee_per_km: feePerKm,
      max_distance_fee: maxDistanceFee,
      is_active: true,
      updated_by: updatedBy,
    });

    // Save and update cache
    this.cachedConfig =
      await this.inspectionDistanceFeeRepository.save(newConfig);
    return this.cachedConfig;
  }

  getDistanceFee(distance: number): number {
    if (!this.cachedConfig) {
      // Use default values if config not available
      return Math.min(distance * 5, 500);
    }

    return Math.min(
      distance * this.cachedConfig.fee_per_km,
      this.cachedConfig.max_distance_fee,
    );
  }
}
