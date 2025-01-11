import { Injectable } from "@nestjs/common";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";

@Injectable()
export class InspectionFeeService {
  private base_fee = 50; // Base inspection fee in currency units
  private distance_rate = 2; // Rate per km in currency units
  private max_distance_fee = 500; // Maximum distance fee
  private readonly CATEGORY_MULTIPLIERS = {
    [ProduceCategory.FOOD_GRAINS]: 1.0,
    [ProduceCategory.VEGETABLES]: 1.2,
    [ProduceCategory.FRUITS]: 1.2,
    [ProduceCategory.OILSEEDS]: 1.1,
    [ProduceCategory.SPICES]: 1.3,
    [ProduceCategory.FIBERS]: 1.0,
    [ProduceCategory.SUGARCANE]: 1.1,
    [ProduceCategory.FLOWERS]: 1.4,
    [ProduceCategory.MEDICINAL_PLANTS]: 1.5,
  };

  async calculateInspectionFee(data: {
    category: ProduceCategory;
    distance_km: number;
  }): Promise<{ base_fee: number; distance_fee: number; total_fee: number }> {
    const categoryMultiplier = this.CATEGORY_MULTIPLIERS[data.category] || 1.0;
    const baseFee = this.base_fee * categoryMultiplier;
    const distanceFee = Math.min(data.distance_km * this.distance_rate, this.max_distance_fee);
    const totalFee = baseFee + distanceFee;

    return {
      base_fee: baseFee,
      distance_fee: distanceFee,
      total_fee: totalFee,
    };
  }

  getBaseFee(): number {
    return this.base_fee;
  }

  getDistanceFeeConfig(): { fee_per_km: number; max_fee: number } {
    return {
      fee_per_km: this.distance_rate,
      max_fee: this.max_distance_fee,
    };
  }

  updateBaseFee(fee: number): void {
    if (fee <= 0) {
      throw new Error("Base fee must be greater than 0");
    }
    this.base_fee = fee;
  }

  updateDistanceFeeConfig(config: { fee_per_km: number; max_fee: number }): void {
    if (config.fee_per_km <= 0) {
      throw new Error("Fee per km must be greater than 0");
    }
    if (config.max_fee <= 0) {
      throw new Error("Max fee must be greater than 0");
    }
    this.distance_rate = config.fee_per_km;
    this.max_distance_fee = config.max_fee;
  }
} 