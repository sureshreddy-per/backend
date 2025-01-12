import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BaseFeeConfigService {
  constructor(private readonly configService: ConfigService) {}

  getBaseFee(): number {
    return this.configService.get<number>('BASE_FEE', 10); // Default base fee of 10
  }

  getPerKilometerFee(): number {
    return this.configService.get<number>('PER_KM_FEE', 0.5); // Default 0.5 per km
  }

  getMaximumFee(): number {
    return this.configService.get<number>('MAX_FEE', 50); // Default maximum fee of 50
  }
}
