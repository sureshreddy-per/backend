import { Injectable } from "@nestjs/common";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";

@Injectable()
export class InspectionFeeService {
  public readonly BASE_FEE = 50; // Base inspection fee in currency units
  private readonly DISTANCE_RATE = 2; // Rate per km in currency units
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
    const baseFee = this.BASE_FEE * categoryMultiplier;
    const distanceFee = data.distance_km * this.DISTANCE_RATE;
    const totalFee = baseFee + distanceFee;

    return {
      base_fee: baseFee,
      distance_fee: distanceFee,
      total_fee: totalFee,
    };
  }

  getBaseFee(): number {
    return this.BASE_FEE;
  }
} 