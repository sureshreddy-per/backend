import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InspectionBaseFeeConfig } from '../entities/base-fee-config.entity';
import { ProduceCategory } from '../../produce/entities/produce.entity';

@Injectable()
export class InspectionBaseFeeService {
  private readonly logger = new Logger(InspectionBaseFeeService.name);
  private cachedConfigs: Map<ProduceCategory, InspectionBaseFeeConfig> = new Map();

  constructor(
    @InjectRepository(InspectionBaseFeeConfig)
    private readonly inspectionBaseFeeRepository: Repository<InspectionBaseFeeConfig>
  ) {
    this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
    try {
      const configs = await this.getAllActiveConfigs();
      configs.forEach(config => {
        this.cachedConfigs.set(config.produce_category, config);
      });

      // Create default configs for any missing categories
      for (const category of Object.values(ProduceCategory)) {
        if (!this.cachedConfigs.has(category)) {
          const defaultConfig = await this.createDefaultConfig(category);
          this.cachedConfigs.set(category, defaultConfig);
        }
      }
    } catch (error) {
      this.logger.error('Failed to initialize inspection base fee config cache', error.stack);
    }
  }

  private async createDefaultConfig(category: ProduceCategory): Promise<InspectionBaseFeeConfig> {
    const defaultFees: Record<ProduceCategory, number> = {
      [ProduceCategory.FOOD_GRAINS]: 500,
      [ProduceCategory.OILSEEDS]: 600,
      [ProduceCategory.FRUITS]: 400,
      [ProduceCategory.VEGETABLES]: 400,
      [ProduceCategory.SPICES]: 800,
      [ProduceCategory.FIBERS]: 600,
      [ProduceCategory.SUGARCANE]: 500,
      [ProduceCategory.FLOWERS]: 300,
      [ProduceCategory.MEDICINAL]: 1000
    };

    const defaultConfig = this.inspectionBaseFeeRepository.create({
      produce_category: category,
      inspection_base_fee: defaultFees[category] || 500,
      is_active: true
    });

    return this.inspectionBaseFeeRepository.save(defaultConfig);
  }

  async getAllActiveConfigs(): Promise<InspectionBaseFeeConfig[]> {
    return this.inspectionBaseFeeRepository.find({
      where: { is_active: true }
    });
  }

  async getInspectionBaseFee(category: ProduceCategory): Promise<number> {
    const config = this.cachedConfigs.get(category);
    if (!config) {
      // Return default fee if no config exists
      const defaultFees: Record<ProduceCategory, number> = {
        [ProduceCategory.FOOD_GRAINS]: 500,
        [ProduceCategory.OILSEEDS]: 600,
        [ProduceCategory.FRUITS]: 400,
        [ProduceCategory.VEGETABLES]: 400,
        [ProduceCategory.SPICES]: 800,
        [ProduceCategory.FIBERS]: 600,
        [ProduceCategory.SUGARCANE]: 500,
        [ProduceCategory.FLOWERS]: 300,
        [ProduceCategory.MEDICINAL]: 1000
      };
      return defaultFees[category] || 500;
    }
    return config.inspection_base_fee;
  }

  async updateInspectionBaseFee(
    category: ProduceCategory,
    inspectionBaseFee: number,
    updatedBy: string
  ): Promise<InspectionBaseFeeConfig> {
    // Deactivate current config
    const currentConfig = this.cachedConfigs.get(category);
    if (currentConfig) {
      await this.inspectionBaseFeeRepository.update(
        { id: currentConfig.id },
        { is_active: false }
      );
    }

    // Create new config
    const newConfig = this.inspectionBaseFeeRepository.create({
      produce_category: category,
      inspection_base_fee: inspectionBaseFee,
      is_active: true,
      updated_by: updatedBy
    });

    // Save and update cache
    const savedConfig = await this.inspectionBaseFeeRepository.save(newConfig);
    this.cachedConfigs.set(category, savedConfig);
    return savedConfig;
  }
} 