import { Injectable } from '@nestjs/common';
import { BuyersService } from '../../buyers/buyers.service';
import { ProduceService } from '../../produce/services/produce.service';
import { OffersService } from './offers.service';
import { DailyPriceService } from './daily-price.service';
import { OfferStatus } from '../entities/offer.entity';
import { Produce } from '../../produce/entities/produce.entity';
import { Buyer } from '../../buyers/entities/buyer.entity';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { QualityGrade } from '../../produce/enums/quality-grade.enum';

@Injectable()
export class AutoOfferService {
  constructor(
    private readonly offersService: OffersService,
    private readonly buyersService: BuyersService,
    private readonly produceService: ProduceService,
    private readonly dailyPriceService: DailyPriceService,
  ) {}

  async generateOffersForProduce(produce: Produce): Promise<void> {
    // Get all buyers within 100km radius
    const buyers = await this.buyersService.findNearby(produce.location, 100);
    
    // Generate offers for each matching buyer
    for (const buyer of buyers) {
      // Get buyer's daily price for this produce category
      const dailyPrice = await this.dailyPriceService.findActive(
        buyer.id,
        produce.produce_category
      );

      if (!dailyPrice) continue; // Skip if no active daily price

      // Calculate distance
      const distance = this.calculateDistance(produce.location, buyer.location);

      // Calculate offer price based on quality grade and daily price
      const price = this.calculateOfferPrice(
        produce,
        dailyPrice.min_price,
        dailyPrice.max_price
      );

      const createOfferDto: CreateOfferDto = {
        buyer_id: buyer.id,
        farmer_id: produce.farmer_id,
        produce_id: produce.id,
        price,
        quantity: produce.quantity,
        message: 'Auto-generated offer based on quality assessment and daily price',
        metadata: {
          auto_generated: true,
          initial_status: OfferStatus.ACTIVE,
          valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          quality_grade: produce.quality_grade,
          daily_price_id: dailyPrice.id,
          distance_km: distance
        }
      };

      await this.offersService.create(createOfferDto);
    }
  }

  private calculateOfferPrice(
    produce: Produce,
    minPrice: number,
    maxPrice: number
  ): number {
    const gradeValue = produce.quality_grade as number;
    const priceRange = maxPrice - minPrice;
    
    // Calculate price based on grade (1-10)
    if (gradeValue >= 1 && gradeValue <= 10) {
      return minPrice + (priceRange * ((gradeValue - 1) / 9));
    }
    
    return minPrice; // Default to min price for invalid grades
  }

  private calculateDistance(location1: string, location2: string): number {
    if (!location1 || !location2) return Infinity;

    const [lat1, lng1] = location1.split('-').map(coord => parseFloat(coord));
    const [lat2, lng2] = location2.split('-').map(coord => parseFloat(coord));

    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal place
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
} 