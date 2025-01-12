import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CalculateInspectionFeeParams {
  distance_km: number;
}

export interface InspectionFeeDetails {
  base_fee: number;
  distance_fee: number;
  total_fee: number;
}

@Injectable()
export class InspectionFeeService {
  constructor(private readonly configService: ConfigService) {}

  calculateInspectionFee(params: CalculateInspectionFeeParams): InspectionFeeDetails {
    const baseFee = this.configService.get<number>('INSPECTION_BASE_FEE', 100); // Default 100 INR
    const perKmFee = this.configService.get<number>('INSPECTION_PER_KM_FEE', 10); // Default 10 INR/km
    const maxFee = this.configService.get<number>('INSPECTION_MAX_FEE', 1000); // Default 1000 INR

    const distanceFee = Math.min(params.distance_km * perKmFee, maxFee - baseFee);
    const totalFee = Math.min(baseFee + distanceFee, maxFee);

    return {
      base_fee: baseFee,
      distance_fee: distanceFee,
      total_fee: totalFee
    };
  }
} 