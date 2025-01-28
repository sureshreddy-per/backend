import { Injectable, Logger, NotFoundException, Inject, BadRequestException } from "@nestjs/common";
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
import { OfferStatus } from "../enums/offer-status.enum";
import { InspectionDistanceFeeService } from "../../config/services/fee-config.service";
import { CategorySpecificAssessment } from "../../quality/interfaces/category-assessments.interface";
import { Farmer } from "../../farmers/entities/farmer.entity";
import { FarmersService } from "../../farmers/farmers.service";

interface QualityAssessmentMetadata {
  grade: number;
  defects: string[];
  recommendations: string[];
  category_specific_assessment: CategorySpecificAssessment;
}

const CACHE_TTL = parseInt(process.env.AUTO_OFFER_CACHE_TTL || '3600'); // 1 hour
const CACHE_PREFIX = process.env.AUTO_OFFER_CACHE_PREFIX || 'auto_offer:';

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
    private readonly inspectionDistanceFeeService: InspectionDistanceFeeService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly farmerService: FarmersService,
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
    buyerPreferences?: { min_price: number; max_price: number } | null,
  ): number {
    // Use buyer preferences if available, otherwise use daily price
    const effectiveMinPrice = buyerPreferences?.min_price ?? minPrice;
    const effectiveMaxPrice = buyerPreferences?.max_price ?? maxPrice;

    // Base price calculation based on quality grade
    const qualityPercentage = qualityGrade / 10;
    let basePrice = effectiveMinPrice + (effectiveMaxPrice - effectiveMinPrice) * qualityPercentage;

    // Apply attribute-based adjustments if available
    if (attributes) {
      const attributeMultiplier = this.calculateAttributeMultiplier(attributes);
      basePrice *= attributeMultiplier;
    }

    // Ensure price stays within min-max range
    return Math.min(Math.max(basePrice, effectiveMinPrice), effectiveMaxPrice);
  }

  private calculateAttributeMultiplier(attributes: any): number {
    if (!attributes) return 1;

    let multiplier = 1;

    // Apply generic attribute adjustments
    if (attributes.moisture_content) {
      multiplier *= 1 - (attributes.moisture_content / 100) * 0.1;
    }
    if (attributes.foreign_matter) {
      multiplier *= 1 - (attributes.foreign_matter / 100) * 0.2;
    }
    if (attributes.broken_grains) {
      multiplier *= 1 - (attributes.broken_grains / 100) * 0.15;
    }
    if (attributes.oil_content) {
      multiplier *= 1 + (attributes.oil_content / 100) * 0.2;
    }

    return multiplier;
  }

  private parseLatLng(latLng: string): { lat: number; lng: number } {
    const [lat, lng] = latLng.split(",").map(Number);
    return { lat, lng };
  }

  async generateAutoOffers(produce: any, latestAssessment: any, validBuyers: any[]) {
    const produceLoc = this.parseLatLng(produce.location);
    if (!produceLoc) {
      this.logger.debug(`Invalid produce location for produce ${produce.id}`);
      return;
    }

    for (const buyer of validBuyers) {
      try {
        if (!buyer.location) {
          this.logger.debug(`No location found for buyer ${buyer.id}`);
          continue;
        }

        const buyerLoc = this.parseLatLng(buyer.location);
        const distance = this.calculateDistance(
          produceLoc.lat,
          produceLoc.lng,
          buyerLoc.lat,
          buyerLoc.lng,
        );

        // Get buyer's price preferences for this produce
        const buyerPricePreference = buyer.preferences?.produce_price_preferences?.find(
          pref => pref.produce_name === produce.name
        );

        if (!buyerPricePreference) {
          this.logger.debug(`No price preferences found for buyer ${buyer.id} and produce ${produce.name}`);
          continue;
        }

        // Calculate inspection fee
        const inspectionFee = this.inspectionDistanceFeeService.getDistanceFee(distance);
        this.logger.debug(`Calculated inspection fee for buyer ${buyer.id}: ${inspectionFee}`);

        // Calculate offer price using quality grade, attributes, and buyer preferences
        const offerPrice = this.calculateOfferPrice(
          buyerPricePreference.min_price,
          buyerPricePreference.max_price,
          latestAssessment.quality_grade,
          latestAssessment.category_specific_assessment,
          buyerPricePreference
        );
        this.logger.debug(`Calculated offer price for buyer ${buyer.id}: ${offerPrice}`);

        const offer = await this.offerRepository.save({
          produce_id: produce.id,
          buyer_id: buyer.id,
          farmer_id: produce.farmer_id,
          price_per_unit: offerPrice,
          quantity: produce.quantity,
          status: OfferStatus.PENDING,
          is_auto_generated: true,
          buyer_min_price: buyerPricePreference.min_price,
          buyer_max_price: buyerPricePreference.max_price,
          quality_grade: latestAssessment.quality_grade,
          distance_km: distance,
          inspection_fee: inspectionFee,
          valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000),
          metadata: {
            auto_generated: true,
            quality_assessment_id: latestAssessment.id,
            price: offerPrice,
            quality_grade: latestAssessment.quality_grade,
            inspection_fee_details: {
              total_fee: inspectionFee,
              distance_km: distance
            },
            valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000),
            price_source: 'buyer_preference',
            last_price_updated: buyer.preferences.last_price_updated,
          },
        });

        this.logger.log(`Created offer ${offer.id} for buyer ${buyer.id}`);

        // Emit event for other services
        this.eventEmitter.emit('offer.created', {
          offer: offer,
          produce,
          buyer,
          distance,
        });

        // Notify buyer
        await this.notificationService.create({
          user_id: buyer.user_id,
          type: NotificationType.NEW_AUTO_OFFER,
          data: {
            offer_id: offer.id,
            produce_id: produce.id,
            price: offerPrice,
            quality_grade: latestAssessment.quality_grade,
            inspection_fee: inspectionFee,
            valid_until: offer.valid_until,
            distance_km: distance,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to create offer for buyer ${buyer.id}: ${error.message}`,
          error.stack
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

    // Get the farmer to get their user_id
    const farmer = await this.farmerService.findOne(offer.farmer_id);
    if (!farmer) {
      throw new NotFoundException(`Farmer with ID ${offer.farmer_id} not found`);
    }

    if (!farmer.user_id) {
      throw new BadRequestException(`Farmer ${farmer.id} has no associated user ID`);
    }

    offer.status = OfferStatus.REJECTED;
    offer.rejection_reason = reason;

    const updatedOffer = await this.offerRepository.save(offer);

    // Notify farmer of rejection using their user_id
    try {
      await this.notificationService.create({
        user_id: farmer.user_id,
        type: NotificationType.OFFER_REJECTED,
        data: {
          offer_id: offer.id,
          produce_id: offer.produce_id,
          reason
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send rejection notification to farmer ${farmer.user_id}`, error);
      // Don't throw error as this is a non-critical operation
    }

    return updatedOffer;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async processAutoOffers() {
    this.logger.log('Processing auto offers for active buyers');
    const buyers = await this.buyerRepository.find({
      where: { is_active: true },
      relations: ['user', 'preferences']
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
        status: In([OfferStatus.ACTIVE, OfferStatus.PRICE_MODIFIED]),
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
        // Get the buyer to access their user_id
        const buyer = await this.buyerRepository.findOne({
          where: { id: offer.buyer_id },
          relations: ['user']
        });

        if (!buyer || !buyer.user) {
          this.logger.warn(`Buyer ${offer.buyer_id} or their user not found for expired offer ${offer.id}`);
          continue;
        }

        offer.status = OfferStatus.EXPIRED;
        offer.metadata = {
          ...offer.metadata,
          expired_at: new Date()
        };

        await this.offerRepository.save(offer);

        // Notify using buyer's user_id
        await this.notificationService.create({
          user_id: buyer.user.id,
          type: NotificationType.OFFER_EXPIRED,
          data: {
            offer_id: offer.id,
            produce_id: offer.produce_id,
            expired_at: offer.metadata.expired_at
          }
        });

        this.logger.debug(`Successfully processed expired offer ${offer.id} for buyer ${buyer.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to handle expired offer ${offer.id}: ${error.message}`,
          error.stack
        );
      }
    }
  }

  async recalculateOffersForBuyer(buyer: any): Promise<void> {
    try {
      const buyerWithPrefs = await this.buyerRepository.findOne({
        where: { id: buyer.id },
        relations: ['user', 'preferences'],
      });

      if (!buyerWithPrefs?.preferences?.produce_price_preferences?.length) {
        this.logger.debug(`No price preferences found for buyer ${buyer.id}`);
        return;
      }

      // Get active offers directly from offer repository instead of relying on relation
      const activeOffers = await this.offerRepository.find({
        where: {
          buyer_id: buyer.id,
          status: OfferStatus.PENDING,
        },
        relations: ['produce'],
      });

      if (!activeOffers.length) {
        this.logger.debug(`No active offers found for buyer ${buyer.id}`);
        return;
      }

      for (const offer of activeOffers) {
        try {
          if (!offer.produce) {
            this.logger.warn(`No produce found for offer ${offer.id}`);
            continue;
          }

          // Get buyer's price preferences for this produce
          const buyerPricePreference = buyerWithPrefs.preferences.produce_price_preferences?.find(
            pref => pref.produce_name === offer.produce.name
          );

          if (!buyerPricePreference) {
            this.logger.debug(`No price preferences found for produce ${offer.produce.name}`);
            continue;
          }

          // Recalculate price based on buyer preferences
          const newPrice = this.calculateOfferPrice(
            buyerPricePreference.min_price,
            buyerPricePreference.max_price,
            offer.quality_grade,
            (offer.metadata?.quality_assessment as QualityAssessmentMetadata)?.category_specific_assessment,
            buyerPricePreference
          );

          // Update offer if price has changed
          if (newPrice !== offer.price_per_unit) {
            offer.price_per_unit = newPrice;
            offer.buyer_min_price = buyerPricePreference.min_price;
            offer.buyer_max_price = buyerPricePreference.max_price;

            // Add to price history
            if (!offer.metadata) {
              offer.metadata = { price_history: [] };
            } else if (!offer.metadata.price_history) {
              offer.metadata.price_history = [];
            }

            offer.metadata.price_history.push({
              price: newPrice,
              timestamp: new Date(),
              reason: 'Auto-recalculated based on buyer price preferences'
            });

            await this.offerRepository.save(offer);

            // Notify buyer of price update
            await this.notificationService.create({
              user_id: buyerWithPrefs.user_id,
              type: NotificationType.OFFER_PRICE_UPDATE,
              data: {
                offer_id: offer.id,
                produce_id: offer.produce_id,
                old_price: offer.price_per_unit,
                new_price: newPrice,
                price_source: 'buyer_preference'
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
    } catch (error) {
      this.logger.error(`Failed to process buyer ${buyer.id}: ${error.message}`, error.stack);
    }
  }

  async generateOffersForProduce(produce: Produce): Promise<void> {
    this.logger.debug(`Starting offer generation for produce ${produce.id}`);
    this.logger.debug(`Produce details: name=${produce.name}, location=${produce.location}`);

    const latestAssessment = await this.qualityAssessmentRepository.findOne({
      where: { produce_id: produce.id },
      order: { created_at: "DESC" },
    });

    if (!latestAssessment) {
      this.logger.warn(`No quality assessment found for produce ${produce.id}`);
      return;
    }
    this.logger.debug(`Found quality assessment: grade=${latestAssessment.quality_grade}, confidence=${latestAssessment.confidence_level}`);

    const produceLoc = this.parseLatLng(produce.location);
    this.logger.debug(`Parsed produce location: lat=${produceLoc.lat}, lng=${produceLoc.lng}`);

    // Find active buyers with matching produce name in their preferences
    const buyers = await this.buyerRepository.find({
      where: {
        is_active: true,
      },
      relations: ['user', 'preferences'],
    });

    // Filter buyers based on preferences and price update time
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const buyersWithMatchingPreferences = buyers.filter(buyer => {
      // Check if buyer has matching produce name
      if (!buyer.preferences?.produce_names?.includes(produce.name)) {
        return false;
      }

      // Check if buyer has price preferences
      if (!buyer.preferences.produce_price_preferences?.length) {
        this.logger.debug(`Buyer ${buyer.id} skipped: No price preferences set`);
        return false;
      }

      // Check if prices were updated within last 24 hours
      if (!buyer.preferences.last_price_updated ||
          buyer.preferences.last_price_updated < twentyFourHoursAgo) {
        this.logger.debug(`Buyer ${buyer.id} skipped: Prices not updated in last 24 hours`);
        return false;
      }

      return true;
    });

    if (buyersWithMatchingPreferences.length === 0) {
      this.logger.warn(`No active buyers found for produce ${produce.name}`);
      return;
    }

    this.logger.log(`Found ${buyersWithMatchingPreferences.length} potential buyers for produce ${produce.id}`);

    // Filter buyers by distance and validate location
    const validBuyers = buyersWithMatchingPreferences.filter((buyer) => {
      if (!buyer.location) {
        this.logger.warn(`Buyer ${buyer.id} skipped: No location information`);
        return false;
      }

      if (!buyer.is_active) {
        this.logger.warn(`Buyer ${buyer.id} skipped: Account inactive`);
        return false;
      }

      const buyerLoc = this.parseLatLng(buyer.location);
      const distance = this.calculateDistance(
        produceLoc.lat,
        produceLoc.lng,
        buyerLoc.lat,
        buyerLoc.lng,
      );

      this.logger.debug(`Calculated distance for buyer ${buyer.id}: ${distance}km`);

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
    await this.generateAutoOffers(produce, latestAssessment, validBuyers);
  }
}
