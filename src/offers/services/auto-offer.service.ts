import { Injectable, Logger, NotFoundException, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, LessThan, ArrayContains } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Cron, CronExpression } from "@nestjs/schedule";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { Offer } from "../entities/offer.entity";
import { Buyer } from "../../buyers/entities/buyer.entity";
import { Produce } from "../../produce/entities/produce.entity";
import { QualityAssessment } from "../../quality/entities/quality-assessment.entity";
import { NotificationService } from "../../notifications/services/notification.service";
import { NotificationType } from "../../notifications/enums/notification-type.enum";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";
import { OfferStatus } from "../enums/offer-status.enum";
import { InspectionFeeService } from "../../quality/services/inspection-fee.service";
import { DailyPriceService } from "./daily-price.service";
import { CategorySpecificAssessment } from "../../quality/interfaces/category-assessments.interface";

interface QualityAssessmentMetadata {
  grade: number;
  defects: string[];
  recommendations: string[];
  category_specific_assessment: CategorySpecificAssessment;
}

const CACHE_TTL = 3600; // 1 hour
const CACHE_PREFIX = 'auto_offer:';

@Injectable()
export class AutoOfferService {
  private readonly logger = new Logger(AutoOfferService.name);

  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(Buyer)
    private readonly buyerRepository: Repository<Buyer>,
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>,
    @InjectRepository(QualityAssessment)
    private readonly qualityAssessmentRepository: Repository<QualityAssessment>,
    private readonly notificationService: NotificationService,
    private readonly inspectionFeeService: InspectionFeeService,
    private readonly dailyPriceService: DailyPriceService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private getCacheKey(key: string): string {
    return `${CACHE_PREFIX}${key}`;
  }

  private async clearOfferCache(id: string): Promise<void> {
    const keys = [
      this.getCacheKey(`id:${id}`),
      this.getCacheKey('stats'),
    ];
    await Promise.all(keys.map(key => this.cacheManager.del(key)));
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateOfferPrice(
    minPrice: number,
    maxPrice: number,
    qualityGrade: number,
    attributes?: any,
    category?: ProduceCategory,
  ): number {
    // Base price calculation based on quality grade
    const qualityPercentage = qualityGrade / 10;
    let basePrice = minPrice + (maxPrice - minPrice) * qualityPercentage;

    // Apply attribute-based adjustments if available
    if (attributes && category) {
      const attributeMultiplier = this.calculateAttributeMultiplier(attributes, category);
      basePrice *= attributeMultiplier;
    }

    // Ensure price stays within min-max range
    return Math.min(Math.max(basePrice, minPrice), maxPrice);
  }

  private calculateAttributeMultiplier(
    attributes: any,
    category: ProduceCategory,
  ): number {
    if (!attributes) return 1;

    let multiplier = 1;

    switch (category) {
      case ProduceCategory.FOOD_GRAINS:
        if (attributes.moisture_content) {
          multiplier *= 1 - (attributes.moisture_content / 100) * 0.1;
        }
        if (attributes.foreign_matter) {
          multiplier *= 1 - (attributes.foreign_matter / 100) * 0.2;
        }
        if (attributes.broken_grains) {
          multiplier *= 1 - (attributes.broken_grains / 100) * 0.15;
        }
        break;

      case ProduceCategory.OILSEEDS:
        if (attributes.oil_content) {
          multiplier *= 1 + (attributes.oil_content / 100) * 0.2;
        }
        if (attributes.moisture_content) {
          multiplier *= 1 - (attributes.moisture_content / 100) * 0.1;
        }
        break;

      // Add more categories as needed
    }

    return multiplier;
  }

  private parseLatLng(latLng: string): { lat: number; lng: number } {
    const [lat, lng] = latLng.split(",").map(Number);
    return { lat, lng };
  }

  async generateOffersForProduce(produce: Produce): Promise<void> {
    const latestAssessment = await this.qualityAssessmentRepository.findOne({
      where: { produce_id: produce.id },
      order: { created_at: "DESC" },
    });

    if (!latestAssessment) {
      this.logger.warn(`No quality assessment found for produce ${produce.id}`);
      return;
    }

    const produceLoc = this.parseLatLng(produce.location);

    // Find active buyers within matching category
    const buyers = await this.buyerRepository.find({
      where: {
        categories: ArrayContains([produce.produce_category]),
        is_active: true,
      },
      relations: ['user'],
    });

    if (buyers.length === 0) {
      this.logger.warn(`No active buyers found for produce category ${produce.produce_category}`);
      return;
    }

    this.logger.log(`Found ${buyers.length} potential buyers for produce ${produce.id}`);

    // Filter buyers by distance and validate location
    const validBuyers = buyers.filter((buyer) => {
      if (!buyer.lat_lng) {
        this.logger.warn(`Buyer ${buyer.id} skipped: No location information`);
        return false;
      }

      if (!buyer.is_active) {
        this.logger.warn(`Buyer ${buyer.id} skipped: Account inactive`);
        return false;
      }

      const buyerLoc = this.parseLatLng(buyer.lat_lng);
      const distance = this.calculateDistance(
        produceLoc.lat,
        produceLoc.lng,
        buyerLoc.lat,
        buyerLoc.lng,
      );

      if (distance > 100) {
        this.logger.debug(`Buyer ${buyer.id} skipped: Distance ${distance}km exceeds 100km limit`);
        return false;
      }

      return true;
    });

    if (validBuyers.length === 0) {
      this.logger.warn(`No valid buyers found within 100km radius for produce ${produce.id}`);
      return;
    }

    this.logger.log(`Generating offers for ${validBuyers.length} valid buyers`);

    for (const buyer of validBuyers) {
      try {
        const buyerLoc = this.parseLatLng(buyer.lat_lng);
        const distance = this.calculateDistance(
          produceLoc.lat,
          produceLoc.lng,
          buyerLoc.lat,
          buyerLoc.lng,
        );

        // Get buyer's daily price
        const dailyPrice = await this.dailyPriceService.findActive(
          buyer.id,
          produce.produce_category,
        );

        if (!dailyPrice) {
          this.logger.debug(`No active daily price found for buyer ${buyer.id}`);
          continue;
        }

        // Calculate inspection fee
        const inspectionFee = await this.inspectionFeeService.calculateInspectionFee({
          category: produce.produce_category,
          distance_km: distance,
        });

        // Calculate offer price using both quality grade and category attributes
        const offerPrice = this.calculateOfferPrice(
          dailyPrice.min_price,
          dailyPrice.max_price,
          latestAssessment.quality_grade,
          latestAssessment.category_specific_assessment,
          produce.produce_category,
        );

        const offer = this.offerRepository.create({
          produce_id: produce.id,
          buyer_id: buyer.id,
          farmer_id: produce.farmer_id,
          price_per_unit: offerPrice,
          quantity: produce.quantity,
          status: OfferStatus.PENDING,
          is_auto_generated: true,
          buyer_min_price: dailyPrice.min_price,
          buyer_max_price: dailyPrice.max_price,
          quality_grade: latestAssessment.quality_grade,
          distance_km: distance,
          inspection_fee: inspectionFee.total_fee,
          valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000),
          metadata: {
            ai_confidence: latestAssessment.confidence_level,
            inspection_fee_details: inspectionFee,
            quality_assessment: {
              grade: latestAssessment.quality_grade,
              defects: latestAssessment.defects || [],
              recommendations: latestAssessment.recommendations || [],
              category_specific_assessment: latestAssessment.category_specific_assessment || {},
              category_specific_attributes: latestAssessment.category_specific_assessment || {}
            },
            daily_price_id: dailyPrice.id,
            price_history: [{
              price: offerPrice,
              timestamp: new Date(),
              reason: 'Auto-generated based on quality grade and attributes'
            }]
          }
        } as Partial<Offer>);

        const savedOffer = await this.offerRepository.save(offer as Offer);
        this.logger.log(`Created offer ${savedOffer.id} for buyer ${buyer.id}`);

        // Emit event for other services
        this.eventEmitter.emit('offer.created', {
          offer: savedOffer,
          produce,
          buyer,
          distance,
        });

        // Notify buyer
        await this.notificationService.create({
          user_id: buyer.user_id,
          type: NotificationType.NEW_AUTO_OFFER,
          data: {
            offer_id: savedOffer.id,
            produce_id: produce.id,
            price: offerPrice,
            quality_grade: latestAssessment.quality_grade,
            inspection_fee: inspectionFee.total_fee,
            valid_until: offer.valid_until,
            distance_km: distance,
            daily_price_id: dailyPrice.id,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to create offer for buyer ${buyer.id}: ${error.message}`,
          error.stack,
        );
        continue;
      }
    }
  }

  async approveOffer(
    offerId: string,
    buyerId: string,
    data?: { price_per_unit?: number; price_modification_reason?: string },
  ): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId, buyer_id: buyerId }
    });

    if (!offer) {
      throw new NotFoundException(`Offer ${offerId} not found for buyer ${buyerId}`);
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new Error(`Offer ${offerId} is not in PENDING state`);
    }

    if (data?.price_per_unit) {
      // Validate price is within allowed range
      if (data.price_per_unit < offer.buyer_min_price || data.price_per_unit > offer.buyer_max_price) {
        throw new Error(`Price must be between ${offer.buyer_min_price} and ${offer.buyer_max_price}`);
      }

      offer.price_per_unit = data.price_per_unit;
      offer.is_price_overridden = true;
      offer.price_override_at = new Date();
      offer.status = OfferStatus.PRICE_MODIFIED;
      offer.price_override_reason = data.price_modification_reason || 'Price modified during approval';
      
      // Add to price history
      if (!offer.metadata.price_history) {
        offer.metadata.price_history = [];
      }
      offer.metadata.price_history.push({
        price: data.price_per_unit,
        timestamp: new Date(),
        reason: data.price_modification_reason || 'Price modified during approval'
      });
    } else {
      offer.status = OfferStatus.ACTIVE;
    }

    const updatedOffer = await this.offerRepository.save(offer);

    // Notify farmer of offer approval/modification
    await this.notificationService.create({
      user_id: offer.farmer_id,
      type: data?.price_per_unit ? NotificationType.OFFER_PRICE_MODIFIED : NotificationType.OFFER_APPROVED,
      data: {
        offer_id: offer.id,
        produce_id: offer.produce_id,
        price: offer.price_per_unit,
        modified: !!data?.price_per_unit,
        modification_reason: data?.price_modification_reason,
        inspection_fee: offer.inspection_fee
      },
    });

    return updatedOffer;
  }

  async rejectOffer(offerId: string, buyerId: string, reason: string): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId, buyer_id: buyerId }
    });

    if (!offer) {
      throw new NotFoundException(`Offer ${offerId} not found for buyer ${buyerId}`);
    }

    offer.status = OfferStatus.REJECTED;
    offer.rejection_reason = reason;

    const updatedOffer = await this.offerRepository.save(offer);

    // Notify farmer of rejection
    await this.notificationService.create({
      user_id: offer.farmer_id,
      type: NotificationType.OFFER_REJECTED,
      data: {
        offer_id: offer.id,
        produce_id: offer.produce_id,
        reason
      },
    });

    return updatedOffer;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async processAutoOffers() {
    this.logger.log('Processing auto offers for active buyers');
    const buyers = await this.buyerRepository.find({ 
      where: { is_active: true },
      relations: ['user'] 
    });
    
    for (const buyer of buyers) {
      try {
        await this.recalculateOffersForBuyer(buyer);
      } catch (error) {
        this.logger.error(`Failed to process auto offers for buyer ${buyer.id}: ${error.message}`);
      }
    }
  }

  async findExpiredOffers(): Promise<Offer[]> {
    const cacheKey = this.getCacheKey('expired');
    const cached = await this.cacheManager.get<Offer[]>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const offers = await this.offerRepository.find({
      where: {
        status: OfferStatus.PENDING,
        valid_until: LessThan(now)
      }
    });

    this.logger.log(`Found ${offers.length} expired offers`);
    await this.cacheManager.set(cacheKey, offers, 300); // Cache for 5 minutes
    return offers;
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleExpiredOffers() {
    this.logger.log('Checking for expired offers');
    const expiredOffers = await this.findExpiredOffers();
    
    for (const offer of expiredOffers) {
      try {
        offer.status = OfferStatus.EXPIRED;
        offer.metadata = {
          ...offer.metadata,
          expired_at: new Date()
        };
        
        await this.offerRepository.save(offer);
        
        // Notify relevant parties
        await this.notificationService.create({
          user_id: offer.buyer_id,
          type: NotificationType.OFFER_EXPIRED,
          data: {
            offer_id: offer.id,
            produce_id: offer.produce_id,
            expired_at: offer.metadata.expired_at
          }
        });
      } catch (error) {
        this.logger.error(`Failed to expire offer ${offer.id}: ${error.message}`);
      }
    }
  }

  async recalculateOffersForBuyer(buyer: Buyer): Promise<void> {
    this.logger.log(`Recalculating offers for buyer ${buyer.id}`);
    
    const pendingOffers = await this.offerRepository.find({
      where: {
        buyer_id: buyer.id,
        status: OfferStatus.PENDING
      },
      relations: ['produce']
    });

    for (const offer of pendingOffers) {
      try {
        const dailyPrice = await this.dailyPriceService.findActive(
          buyer.id,
          offer.produce.produce_category
        );

        if (!dailyPrice) {
          this.logger.warn(`No active daily price found for buyer ${buyer.id}`);
          continue;
        }

        // Recalculate price based on current daily price
        const newPrice = this.calculateOfferPrice(
          dailyPrice.min_price,
          dailyPrice.max_price,
          offer.quality_grade,
          (offer.metadata?.quality_assessment as QualityAssessmentMetadata)?.category_specific_assessment,
          offer.produce.produce_category
        );

        // Update offer if price has changed
        if (newPrice !== offer.price_per_unit) {
          offer.price_per_unit = newPrice;
          offer.buyer_min_price = dailyPrice.min_price;
          offer.buyer_max_price = dailyPrice.max_price;
          
          // Add to price history
          if (!offer.metadata.price_history) {
            offer.metadata.price_history = [];
          }
          offer.metadata.price_history.push({
            price: newPrice,
            timestamp: new Date(),
            reason: 'Auto-recalculated based on updated daily price'
          });

          await this.offerRepository.save(offer);
          
          // Notify buyer of price update
          await this.notificationService.create({
            user_id: buyer.user_id,
            type: NotificationType.OFFER_PRICE_UPDATE,
            data: {
              offer_id: offer.id,
              produce_id: offer.produce_id,
              old_price: offer.price_per_unit,
              new_price: newPrice,
              daily_price_id: dailyPrice.id
            }
          });
        }
      } catch (error) {
        this.logger.error(
          `Failed to recalculate offer ${offer.id} for buyer ${buyer.id}: ${error.message}`,
          error.stack
        );
      }
    }
  }
}
