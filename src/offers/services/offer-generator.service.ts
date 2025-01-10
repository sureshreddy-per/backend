import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ProduceCategory } from '../../produce/enums/produce-category.enum';
import { QualityGrade } from '../../produce/enums/quality-grade.enum';
import { DailyPriceService } from './daily-price.service';
import { BuyersService } from '../../buyers/buyers.service';
import { OffersService } from './offers.service';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { OfferStatus } from '../entities/offer.entity';
import { Produce } from '../../produce/entities/produce.entity';
import { QualityAssessment } from '../../quality/entities/quality-assessment.entity';
import { ProduceService } from '../../produce/services/produce.service';
import { InspectionDistanceFeeService } from '../../config/services/fee-config.service';

@Injectable()
export class OfferGeneratorService {
  private readonly logger = new Logger(OfferGeneratorService.name);

  constructor(
    private readonly dailyPriceService: DailyPriceService,
    private readonly buyersService: BuyersService,
    private readonly offersService: OffersService,
    private readonly eventEmitter: EventEmitter2,
    private readonly produceService: ProduceService,
    private readonly inspectionDistanceFeeService: InspectionDistanceFeeService
  ) {}

  @OnEvent('quality.assessment.completed')
  async handleQualityAssessmentCompleted(assessment: QualityAssessment): Promise<void> {
    this.logger.log(`Generating offers for produce ${assessment.produce_id} after quality assessment`);

    try {
      const produce = await this.produceService.findOne(assessment.produce_id);

      if (!produce) {
        throw new Error(`Produce ${assessment.produce_id} not found`);
      }

      await this.generateOffersForProduce(produce);
    } catch (error) {
      this.logger.error(`Error generating offers: ${error.message}`, error.stack);
    }
  }

  async generateOffersForProduce(produce: Produce): Promise<void> {
    if (!produce.location) {
      this.logger.warn(`No location found for produce ${produce.id}`);
      return;
    }

    // Get all buyers within 100km radius
    const buyers = await this.buyersService.findNearby(produce.location, 100);

    // Generate offers for each matching buyer
    for (const buyer of buyers) {
      try {
        // Handle inspection request if needed
        await this.handleInspectionRequest(produce, buyer);

        // Get buyer's daily price for this category
        const dailyPrice = await this.dailyPriceService.findActive(
          buyer.id,
          produce.produce_category
        );

        if (!dailyPrice) {
          this.logger.debug(`No active daily price found for buyer ${buyer.id}`);
          continue;
        }

        // Calculate distance
        const distance = this.calculateDistance(produce.location, buyer.lat_lng);

        // Calculate offer price based on quality grade and daily price
        const price = this.calculatePrice(
          dailyPrice.min_price,
          dailyPrice.max_price,
          produce.quality_grade,
          produce.quality_assessments[0]?.category_specific_assessment,
          produce
        );

        // Create offer if within acceptable range and price
        if (this.isOfferViable(price, distance, dailyPrice)) {
          const offerDto: CreateOfferDto = {
            buyer_id: buyer.id,
            farmer_id: produce.farmer_id,
            produce_id: produce.id,
            price,
            quantity: produce.quantity,
            message: this.generateOfferMessage(produce.quality_grade, distance),
            metadata: {
              auto_generated: true,
              initial_status: OfferStatus.ACTIVE,
              valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
              quality_grade: produce.quality_grade,
              daily_price_id: dailyPrice.id,
              distance_km: distance,
              category_attributes: produce.quality_assessments[0]?.category_specific_assessment,
              inspection_required: produce.is_inspection_requested,
              inspection_fee: produce.inspection_fee
            }
          };

          await this.offersService.create(offerDto);

          // Emit events for notifications
          this.eventEmitter.emit('offer.created', {
            offer: offerDto,
            produce,
            buyer,
            distance
          });
        }
      } catch (error) {
        this.logger.error(
          `Error generating offer for buyer ${buyer.id}: ${error.message}`,
          error.stack
        );
      }
    }
  }

  private calculatePrice(
    minPrice: number,
    maxPrice: number,
    qualityGrade: QualityGrade,
    attributes: any,
    produce: Produce
  ): number {
    // Get numeric value from QualityGrade enum
    const gradeValue = qualityGrade as number;

    // Calculate price based on grade (1-10)
    const priceRange = maxPrice - minPrice;
    let basePrice = minPrice;

    // Only calculate grade-based price for valid grades (1-10)
    if (gradeValue >= 1 && gradeValue <= 10) {
      basePrice = minPrice + (priceRange * ((gradeValue - 1) / 9));
    }

    // Apply attribute-based adjustments
    const attributeMultiplier = this.calculateAttributeMultiplier(attributes, produce.produce_category);
    const finalPrice = basePrice * attributeMultiplier;

    // Ensure price stays within min-max range
    return Math.min(Math.max(finalPrice, minPrice), maxPrice);
  }

  private calculateAttributeMultiplier(attributes: any, category: ProduceCategory): number {
    if (!attributes) return 1;

    let multiplier = 1;

    switch (category) {
      case ProduceCategory.FOOD_GRAINS:
        // Food grains specific attributes
        if (attributes.moisture_content) {
          multiplier *= (1 - (attributes.moisture_content / 100) * 0.1); // Lower moisture better
        }
        if (attributes.foreign_matter) {
          multiplier *= (1 - (attributes.foreign_matter / 100) * 0.2); // Lower foreign matter better
        }
        if (attributes.broken_grains) {
          multiplier *= (1 - (attributes.broken_grains / 100) * 0.15); // Lower broken grains better
        }
        break;

      case ProduceCategory.OILSEEDS:
        // Oilseeds specific attributes
        if (attributes.oil_content) {
          multiplier *= (1 + (attributes.oil_content / 100) * 0.2); // Higher oil content better
        }
        if (attributes.moisture_content) {
          multiplier *= (1 - (attributes.moisture_content / 100) * 0.1);
        }
        break;

      case ProduceCategory.FRUITS:
        // Fruits specific attributes
        if (attributes.ripeness === 'optimal') multiplier *= 1.1;
        if (attributes.sugar_content) {
          multiplier *= (1 + (attributes.sugar_content / 100) * 0.1);
        }
        if (attributes.appearance === 'excellent') multiplier *= 1.05;
        break;

      case ProduceCategory.VEGETABLES:
        // Vegetables specific attributes
        if (attributes.freshness === 'high') multiplier *= 1.1;
        if (attributes.color_uniformity === 'high') multiplier *= 1.05;
        if (attributes.physical_damage === 'none') multiplier *= 1.05;
        break;

      case ProduceCategory.SPICES:
        // Spices specific attributes
        if (attributes.aroma === 'strong') multiplier *= 1.1;
        if (attributes.essential_oil_content) {
          multiplier *= (1 + (attributes.essential_oil_content / 100) * 0.15);
        }
        break;

      case ProduceCategory.FIBERS:
        // Fibers specific attributes
        if (attributes.fiber_length) {
          multiplier *= (1 + (attributes.fiber_length / 100) * 0.2);
        }
        if (attributes.strength === 'high') multiplier *= 1.1;
        break;

      case ProduceCategory.SUGARCANE:
        // Sugarcane specific attributes
        if (attributes.sugar_content) {
          multiplier *= (1 + (attributes.sugar_content / 100) * 0.2);
        }
        if (attributes.maturity === 'optimal') multiplier *= 1.1;
        break;

      case ProduceCategory.FLOWERS:
        // Flowers specific attributes
        if (attributes.freshness === 'high') multiplier *= 1.1;
        if (attributes.color_vibrancy === 'high') multiplier *= 1.05;
        if (attributes.stem_length === 'optimal') multiplier *= 1.05;
        break;

      case ProduceCategory.MEDICINAL_PLANTS:
        // Medicinal plants specific attributes
        if (attributes.active_compounds) {
          multiplier *= (1 + (attributes.active_compounds / 100) * 0.2);
        }
        if (attributes.purity === 'high') multiplier *= 1.1;
        break;
    }

    // Cap multiplier between 0.9 and 1.1 (±10%)
    return Math.max(0.9, Math.min(1.1, multiplier));
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

  private isOfferViable(price: number, distance: number, dailyPrice: any): boolean {
    // Check if price is within acceptable range
    if (price < dailyPrice.min_price || price > dailyPrice.max_price) return false;

    // Check if distance is acceptable (max 100km)
    if (distance > 100) return false;

    return true;
  }

  private generateOfferMessage(quality: QualityGrade, distance: number): string {
    const gradeValue = quality as number;
    let qualityText = 'standard';

    if (gradeValue >= 8) {
      qualityText = 'premium';
    } else if (gradeValue >= 5) {
      qualityText = 'good';
    } else if (gradeValue >= 1) {
      qualityText = 'basic';
    }

    return `Automatic offer for ${qualityText} quality produce located ${distance}km away. Valid for 24 hours.`;
  }

  private async handleInspectionRequest(produce: Produce, buyer: any): Promise<void> {
    if (produce.is_inspection_requested) {
      // If inspection is already requested, add inspection fee to metadata
      return;
    }

    // Check if buyer requires inspection based on quality grade or category
    const requiresInspection = this.shouldRequestInspection(produce);
    if (!requiresInspection) {
      return;
    }

    // Calculate inspection fee based on distance and produce category
    const inspectionFee = this.calculateInspectionFee(
      produce.produce_category,
      this.calculateDistance(produce.location, buyer.lat_lng)
    );

    // Update produce with inspection request
    await this.produceService.update(produce.id, {
      is_inspection_requested: true,
      inspection_requested_by: buyer.id,
      inspection_requested_at: new Date(),
      inspection_fee: inspectionFee
    });

    // Emit inspection request event
    this.eventEmitter.emit('inspection.requested', {
      produce_id: produce.id,
      buyer_id: buyer.id,
      inspection_fee: inspectionFee
    });
  }

  private shouldRequestInspection(produce: Produce): boolean {
    const gradeValue = produce.quality_grade as number;

    // Always request inspection for high-value categories
    if ([
      ProduceCategory.SPICES,
      ProduceCategory.MEDICINAL_PLANTS
    ].includes(produce.produce_category)) {
      return true;
    }

    // Request inspection for low-grade produce
    if (gradeValue <= 3) {
      return true;
    }

    // Request inspection for large quantity transactions
    if (this.isLargeQuantity(produce)) {
      return true;
    }

    return false;
  }

  private isLargeQuantity(produce: Produce): boolean {
    // Define thresholds for each category (in their respective units)
    const thresholds: Record<ProduceCategory, number> = {
      [ProduceCategory.FOOD_GRAINS]: 1000, // kg
      [ProduceCategory.OILSEEDS]: 500, // kg
      [ProduceCategory.FRUITS]: 200, // kg
      [ProduceCategory.VEGETABLES]: 200, // kg
      [ProduceCategory.SPICES]: 100, // kg
      [ProduceCategory.FIBERS]: 200, // kg
      [ProduceCategory.SUGARCANE]: 1000, // kg
      [ProduceCategory.FLOWERS]: 100, // bunches
      [ProduceCategory.MEDICINAL_PLANTS]: 50 // kg
    };

    return produce.quantity > (thresholds[produce.produce_category] || 0);
  }

  private calculateInspectionFee(category: ProduceCategory, distance: number): number {
    const baseFee = this.getBaseFeeForCategory(category);
    const distanceFee = this.inspectionDistanceFeeService.getDistanceFee(distance);
    return baseFee + distanceFee;
  }

  private getBaseFeeForCategory(category: ProduceCategory): number {
    // Base fee by category
    const baseFees: Record<ProduceCategory, number> = {
      [ProduceCategory.FOOD_GRAINS]: 500,
      [ProduceCategory.OILSEEDS]: 600,
      [ProduceCategory.FRUITS]: 400,
      [ProduceCategory.VEGETABLES]: 400,
      [ProduceCategory.SPICES]: 800,
      [ProduceCategory.FIBERS]: 600,
      [ProduceCategory.SUGARCANE]: 500,
      [ProduceCategory.FLOWERS]: 300,
      [ProduceCategory.MEDICINAL_PLANTS]: 1000
    };

    // Get base fee for category
    return baseFees[category] || 500;
  }
}