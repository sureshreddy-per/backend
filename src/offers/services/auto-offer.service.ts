import { Injectable, Logger, NotFoundException, Inject, BadRequestException, forwardRef } from "@nestjs/common";
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
import { NotificationType } from "../../notifications/enums/notification-type.enum";
import { OfferStatus } from "../enums/offer-status.enum";
import { InspectionDistanceFeeService } from "../../config/services/fee-config.service";
import { CategorySpecificAssessment } from "../../quality/interfaces/category-assessments.interface";
import { Farmer } from "../../farmers/entities/farmer.entity";
import { FarmersService } from "../../farmers/farmers.service";
import { OffersService } from "../services/offers.service";
import { OfferTransformationService } from './offer-transformation.service';
import { ProduceMaster } from "../../produce/entities/produce-master.entity";
import { ProduceSynonymService } from "../../produce/services/synonym.service";
import { ProduceStatus } from "../../produce/enums/produce-status.enum";
import { SystemConfigService } from '../../config/services/system-config.service';
import { SystemConfigKey } from '../../config/enums/system-config-key.enum';

interface QualityAssessmentMetadata {
  grade: number;
  defects: string[];
  recommendations: string[];
  category_specific_assessment?: CategorySpecificAssessment;
}

interface OfferMetadata {
  quality_assessment?: QualityAssessmentMetadata;
  price_history?: Array<{
    price: number;
    timestamp: Date;
    reason: string;
  }>;
  cancellation_reason?: string;
  cancelled_at?: Date;
  auto_generated?: boolean;
  quality_assessment_id?: string;
  price?: number;
  quality_grade?: number;
  inspection_fee_details?: {
    total_fee: number;
    distance_km: number;
  };
  valid_until?: Date;
  price_source?: string;
  last_price_updated?: Date;
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
    @InjectRepository(ProduceMaster)
    private readonly produceMasterRepository: Repository<ProduceMaster>,
    private readonly inspectionDistanceFeeService: InspectionDistanceFeeService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly farmerService: FarmersService,
    @Inject(forwardRef(() => OffersService))
    private readonly offersService: OffersService,
    private readonly offerTransformationService: OfferTransformationService,
    private readonly produceSynonymService: ProduceSynonymService,
    private readonly systemConfigService: SystemConfigService,
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Handle preference updates for new offer generation
    this.eventEmitter.on('buyer.preferences.updated', async (payload: {
      buyer: Buyer;
      oldPreferences: string[];
      newPreferences: string[];
      pricePreferences?: Array<{ produce_name: string; min_price: number; max_price: number; }>;
    }) => {
      try {
        await this.generateOffersForBuyerPreferences(payload.buyer);
      } catch (error) {
        this.logger.error(
          `Failed to generate offers for buyer ${payload.buyer.id} after preferences update: ${error.message}`,
          error.stack
        );
      }
    });

    // Handle preference changes for existing offers
    this.eventEmitter.on('buyer.preferences.changed', async (payload: {
      buyer: Buyer;
      oldPreferences: string[];
      newPreferences: string[];
      pricePreferences?: Array<{ produce_name: string; min_price: number; max_price: number; }>;
    }) => {
      try {
        await this.handleExistingOffers(
          payload.buyer.id,
          payload.oldPreferences,
          payload.newPreferences,
          payload.pricePreferences
        );
      } catch (error) {
        this.logger.error(
          `Failed to handle existing offers for buyer ${payload.buyer.id}: ${error.message}`,
          error.stack
        );
      }
    });
  }

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
    categoryAssessment: CategorySpecificAssessment | undefined,
    pricePreference: { min_price: number; max_price: number }
  ): number {
    // Base calculation using quality grade
    const qualityFactor = qualityGrade / 100;
    let price = minPrice + (maxPrice - minPrice) * qualityFactor;

    // Apply category-specific adjustments if available
    if (categoryAssessment) {
      // Add your category-specific price adjustments here
      // This is just an example - adjust based on your business logic
      if (categoryAssessment.ripeness) {
        price *= (1 + categoryAssessment.ripeness / 100);
      }
    }

    // Ensure price stays within buyer's preferred range
    price = Math.max(pricePreference.min_price, Math.min(price, pricePreference.max_price));

    return Math.round(price * 100) / 100; // Round to 2 decimal places
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
    this.logger.debug(`[AutoOfferService] Starting generateAutoOffers for produce ${produce.id} with ${validBuyers.length} buyers`);
    
    const produceLoc = this.parseLatLng(produce.location);
    if (!produceLoc) {
      this.logger.debug(`[AutoOfferService] Invalid produce location for produce ${produce.id}`);
      return;
    }

    for (const buyer of validBuyers) {
      try {
        this.logger.debug(`[AutoOfferService] Processing buyer ${buyer.id}`);
        
        if (!buyer.location) {
          this.logger.debug(`[AutoOfferService] No location found for buyer ${buyer.id}`);
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
          this.logger.debug(`[AutoOfferService] No price preferences found for buyer ${buyer.id} and produce ${produce.name}`);
          continue;
        }

        // Calculate inspection fee
        const inspectionFee = this.inspectionDistanceFeeService.getDistanceFee(distance);
        this.logger.debug(`[AutoOfferService] Calculated inspection fee for buyer ${buyer.id}: ${inspectionFee}`);

        // Calculate offer price using quality grade, attributes, and buyer preferences
        const offerPrice = this.calculateOfferPrice(
          buyerPricePreference.min_price,
          buyerPricePreference.max_price,
          latestAssessment.quality_grade,
          latestAssessment.category_specific_assessment,
          buyerPricePreference
        );
        this.logger.debug(`[AutoOfferService] Calculated offer price for buyer ${buyer.id}: ${offerPrice}`);

        this.logger.debug(`[AutoOfferService] Creating offer with data:
          produce_id: ${produce.id}
          buyer_id: ${buyer.id}
          farmer_id: ${produce.farmer_id}
          price_per_unit: ${offerPrice}
          quantity: ${produce.quantity}
          quality_grade: ${latestAssessment.quality_grade}
          distance_km: ${distance}
          inspection_fee: ${inspectionFee}
        `);

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

        this.logger.log(`[AutoOfferService] Created offer ${offer.id} for buyer ${buyer.id}`);

        // Emit event for other services
        this.eventEmitter.emit('offer.created', {
          offer: offer,
          produce,
          buyer,
          distance,
        });

        // Notify buyer
        await this.notifyUser(buyer.user_id, NotificationType.NEW_AUTO_OFFER, {
          offer_id: offer.id,
          produce_id: produce.id,
          price: offerPrice,
          quality_grade: latestAssessment.quality_grade,
          inspection_fee: inspectionFee,
          valid_until: offer.valid_until,
          distance_km: distance,
        });
        this.logger.debug(`[AutoOfferService] Sent notification to buyer ${buyer.id}`);
      } catch (error) {
        this.logger.error(
          `[AutoOfferService] Failed to create offer for buyer ${buyer.id}: ${error.message}`,
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
    return await this.offerRepository.manager.transaction(async transactionalEntityManager => {
      const offer = await transactionalEntityManager.findOne(Offer, {
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

      const updatedOffer = await transactionalEntityManager.save(Offer, offer);

      // Notify farmer of offer approval/modification
      await this.notifyUser(offer.farmer_id, data?.price_per_unit ? NotificationType.OFFER_PRICE_MODIFIED : NotificationType.OFFER_APPROVED, {
        offer_id: offer.id,
        produce_id: offer.produce_id,
        price: offer.price_per_unit,
        modified: !!data?.price_per_unit,
        modification_reason: data?.price_modification_reason,
        inspection_fee: offer.inspection_fee
      });

      return this.offerTransformationService.transformOffer(updatedOffer, transactionalEntityManager);
    });
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
      await this.notifyUser(farmer.user_id, NotificationType.OFFER_REJECTED, {
        offer_id: offer.id,
        produce_id: offer.produce_id,
        reason
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
        await this.notifyUser(buyer.user.id, NotificationType.OFFER_EXPIRED, {
          offer_id: offer.id,
          produce_id: offer.produce_id,
          expired_at: offer.metadata.expired_at
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
            await this.notifyUser(buyerWithPrefs.user_id, NotificationType.OFFER_PRICE_UPDATE, {
              offer_id: offer.id,
              produce_id: offer.produce_id,
              old_price: offer.price_per_unit,
              new_price: newPrice,
              price_source: 'buyer_preference'
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
    this.logger.debug(`[AutoOfferService] Starting offer generation for produce ${produce.id}`);
    this.logger.debug(`[AutoOfferService] Produce details: name=${produce.name}, location=${produce.location}, status=${produce.status}`);

    const latestAssessment = await this.qualityAssessmentRepository.findOne({
      where: { produce_id: produce.id },
      order: { created_at: "DESC" },
    });

    if (!latestAssessment) {
      this.logger.warn(`[AutoOfferService] No quality assessment found for produce ${produce.id}`);
      return;
    }
    this.logger.debug(`[AutoOfferService] Found quality assessment: grade=${latestAssessment.quality_grade}, confidence=${latestAssessment.confidence_level}`);

    const produceLoc = this.parseLatLng(produce.location);
    this.logger.debug(`[AutoOfferService] Parsed produce location: lat=${produceLoc.lat}, lng=${produceLoc.lng}`);

    // Find active buyers with matching produce name in their preferences
    const buyers = await this.buyerRepository.find({
      where: {
        is_active: true,
      },
      relations: ['user', 'preferences'],
    });
    this.logger.debug(`[AutoOfferService] Found ${buyers.length} active buyers`);

    // Filter buyers based on preferences and price update time
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const buyersWithMatchingPreferences = await Promise.all(buyers.map(async buyer => {
      const produceName = produce.name.toLowerCase().trim();
      const canonicalName = await this.validateAndNormalizeProduce(produceName);
      
      if (!canonicalName) {
        this.logger.debug(`[AutoOfferService] Produce name ${produceName} not found in master list or synonyms`);
        return false;
      }

      // Check if buyer has matching produce name in either produce_names or produce_price_preferences
      const hasMatchingProduceName = 
        buyer.preferences?.produce_names?.some(name => {
          const normalizedBuyerName = name.toLowerCase().trim();
          return normalizedBuyerName === canonicalName.toLowerCase() ||
                 normalizedBuyerName === produceName;
        }) ||
        buyer.preferences?.produce_price_preferences?.some(pref => {
          const normalizedPrefName = pref.produce_name.toLowerCase().trim();
          return normalizedPrefName === canonicalName.toLowerCase() ||
                 normalizedPrefName === produceName;
        });

      if (!hasMatchingProduceName) {
        this.logger.debug(`[AutoOfferService] Buyer ${buyer.id} skipped: No matching produce name in preferences. Produce name: ${produceName}, Canonical name: ${canonicalName}, Buyer preferences: ${JSON.stringify({
          produce_names: buyer.preferences?.produce_names,
          price_preferences: buyer.preferences?.produce_price_preferences?.map(p => p.produce_name)
        })}`);
        return false;
      }

      // Check if buyer has price preferences
      if (!buyer.preferences.produce_price_preferences?.length) {
        this.logger.debug(`[AutoOfferService] Buyer ${buyer.id} skipped: No price preferences set`);
        return false;
      }

      // Check if prices were updated within last 24 hours
      if (!buyer.preferences.last_price_updated ||
          buyer.preferences.last_price_updated < twentyFourHoursAgo) {
        this.logger.debug(`[AutoOfferService] Buyer ${buyer.id} skipped: Prices not updated in last 24 hours. Last update: ${buyer.preferences.last_price_updated}`);
        return false;
      }

      return true;
    }));

    const filteredBuyers = buyers.filter((_, index) => buyersWithMatchingPreferences[index]);

    if (filteredBuyers.length === 0) {
      this.logger.warn(`[AutoOfferService] No active buyers found for produce ${produce.name}. All buyers: ${JSON.stringify(buyers.map(b => ({
        id: b.id,
        produce_names: b.preferences?.produce_names,
        price_preferences: b.preferences?.produce_price_preferences?.map(p => p.produce_name)
      })))}`);
      return;
    }

    this.logger.log(`[AutoOfferService] Found ${filteredBuyers.length} potential buyers for produce ${produce.id}`);

    const maxRadius = Number(await this.systemConfigService.getValue(SystemConfigKey.MAX_BUYER_RADIUS_KM));

    const validBuyers = (await Promise.all(filteredBuyers.map(async (buyer) => {
      if (!buyer.location) {
        this.logger.warn(`[AutoOfferService] Buyer ${buyer.id} skipped: No location information`);
        return null;
      }

      if (!buyer.is_active) {
        this.logger.warn(`[AutoOfferService] Buyer ${buyer.id} skipped: Account inactive`);
        return null;
      }

      const buyerLoc = this.parseLatLng(buyer.location);
      const distance = this.calculateDistance(
        produceLoc.lat,
        produceLoc.lng,
        buyerLoc.lat,
        buyerLoc.lng,
      );

      this.logger.debug(`[AutoOfferService] Calculated distance for buyer ${buyer.id}: ${distance}km`);

      if (distance > maxRadius) {
        this.logger.debug(`[AutoOfferService] Buyer ${buyer.id} skipped: Distance ${distance}km exceeds ${maxRadius}km limit`);
        return null;
      }

      return buyer;
    }))).filter(buyer => buyer !== null);

    if (validBuyers.length === 0) {
      this.logger.warn(`[AutoOfferService] No valid buyers found within ${maxRadius}km radius for produce ${produce.id}`);
      return;
    }

    this.logger.log(`[AutoOfferService] Generating offers for ${validBuyers.length} valid buyers`);
    await this.generateAutoOffers(produce, latestAssessment, validBuyers);
  }

  private async validateAndNormalizeProduce(produceName: string): Promise<string | null> {
    // First check if the name exists in ProduceMaster
    const masterProduce = await this.produceMasterRepository.findOne({
      where: { name: produceName.toLowerCase().trim(), isActive: true }
    });

    if (masterProduce) {
      return masterProduce.name;
    }

    // If not found in master, check synonyms
    const canonicalName = await this.produceSynonymService.findExistingProduceNameFromSynonyms(produceName);
    if (canonicalName) {
      return canonicalName;
    }

    return null;
  }

  async getAutoOffer(offerId: string, buyerId: string): Promise<Offer> {
    return await this.offerRepository.manager.transaction(async transactionalEntityManager => {
      const offer = await transactionalEntityManager.findOne(Offer, {
        where: { id: offerId, buyer_id: buyerId }
      });
      const updatedOffer = await transactionalEntityManager.save(Offer, offer);
      return this.offerTransformationService.transformOffer(updatedOffer, transactionalEntityManager);
    });
  }

  async generateOffersForBuyerPreferences(buyer: Buyer): Promise<void> {
    this.logger.debug(`[AutoOfferService] Starting offer generation for buyer ${buyer.id}`);

    if (!buyer.location) {
      this.logger.debug(`[AutoOfferService] No location found for buyer ${buyer.id}`);
      return;
    }

    const maxRadius = Number(await this.systemConfigService.getValue(SystemConfigKey.MAX_BUYER_RADIUS_KM));

    // Get all available produce within configured radius
    const [lat, lng] = buyer.location.split(',').map(Number);
    const produces = await this.produceRepository.find({
      where: {
        status: ProduceStatus.AVAILABLE,
      },
      relations: ['quality_assessments'],
      order: {
        quality_assessments: {
          created_at: 'DESC'
        }
      }
    });

    // Filter produces by distance and buyer preferences
    const validProduces = produces.filter(produce => {
      // Skip if no location
      if (!produce.location) return false;

      // Check distance
      const produceLoc = this.parseLatLng(produce.location);
      if (!produceLoc) return false;

      const distance = this.calculateDistance(
        lat,
        lng,
        produceLoc.lat,
        produceLoc.lng
      );

      if (distance > maxRadius) return false;

      // Check if produce name matches buyer preferences
      const produceName = produce.name.toLowerCase().trim();
      const hasMatchingPreference = 
        buyer.preferences?.produce_names?.some(name => 
          name.toLowerCase().trim() === produceName
        ) ||
        buyer.preferences?.produce_price_preferences?.some(pref => 
          pref.produce_name.toLowerCase().trim() === produceName
        );

      return hasMatchingPreference;
    });

    if (validProduces.length === 0) {
      this.logger.debug(`[AutoOfferService] No valid produces found for buyer ${buyer.id}`);
      return;
    }

    // Generate offers for each valid produce
    for (const produce of validProduces) {
      const latestAssessment = produce.quality_assessments?.[0];
      if (!latestAssessment) {
        this.logger.debug(`[AutoOfferService] No quality assessment found for produce ${produce.id}`);
        continue;
      }

      await this.generateAutoOffers(produce, latestAssessment, [buyer]);
    }
  }

  async handleExistingOffers(
    buyerId: string,
    oldPreferences: string[],
    newPreferences: string[],
    pricePreferences?: Array<{ produce_name: string; min_price: number; max_price: number; }>
  ): Promise<void> {
    // Get all pending offers for this buyer
    const activeOffers = await this.offerRepository.find({
      where: {
        buyer_id: buyerId,
        status: OfferStatus.PENDING,
      },
      relations: ['produce'],
      order: {
        created_at: 'DESC'
      }
    });

    for (const offer of activeOffers) {
      try {
        const produceName = offer.produce.name;
        const isProduceInNewPreferences = newPreferences.includes(produceName);
        const pricePreference = pricePreferences?.find(p => p.produce_name === produceName);

        if (!isProduceInNewPreferences) {
          // Cancel offer if produce is removed from preferences
          offer.status = OfferStatus.CANCELLED;
          offer.metadata = {
            ...offer.metadata,
            cancellation_reason: 'Produce removed from buyer preferences',
            cancelled_at: new Date()
          };
          await this.offerRepository.save(offer);

          // Notify farmer
          const farmer = await this.farmerService.findOne(offer.farmer_id);
          if (farmer?.user_id) {
            await this.notifyUser(farmer.user_id, NotificationType.OFFER_STATUS_UPDATE, {
              offer_id: offer.id,
              produce_id: offer.produce_id,
              old_status: OfferStatus.PENDING,
              new_status: OfferStatus.CANCELLED,
              reason: 'Buyer removed produce from preferences'
            });
          }
        } else if (pricePreference) {
          // Update offer if price preferences changed
          const newPrice = this.calculateOfferPrice(
            pricePreference.min_price,
            pricePreference.max_price,
            offer.quality_grade,
            (offer.metadata?.quality_assessment as QualityAssessmentMetadata)?.category_specific_assessment,
            pricePreference
          );

          if (newPrice !== offer.price_per_unit) {
            offer.price_per_unit = newPrice;
            offer.buyer_min_price = pricePreference.min_price;
            offer.buyer_max_price = pricePreference.max_price;
            offer.status = OfferStatus.PENDING;

            // Add to price history
            if (!offer.metadata) {
              offer.metadata = { price_history: [] };
            } else if (!offer.metadata.price_history) {
              offer.metadata.price_history = [];
            }

            offer.metadata.price_history.push({
              price: newPrice,
              timestamp: new Date(),
              reason: 'Buyer updated price preferences'
            });

            await this.offerRepository.save(offer);

            // Notify farmer
            const farmer = await this.farmerService.findOne(offer.farmer_id);
            if (farmer?.user_id) {
              await this.notifyUser(farmer.user_id, NotificationType.OFFER_PRICE_UPDATE, {
                offer_id: offer.id,
                produce_id: offer.produce_id,
                old_price: offer.price_per_unit,
                new_price: newPrice,
                reason: 'Buyer updated price preferences'
              });
            }
          }
        }
      } catch (error) {
        this.logger.error(
          `Failed to handle offer ${offer.id} for buyer ${buyerId}: ${error.message}`,
          error.stack
        );
        continue;
      }
    }
  }

  private async notifyUser(userId: string, type: NotificationType, data: Record<string, any>) {
    this.eventEmitter.emit('notification.create', {
      user_id: userId,
      type,
      data,
    });
  }
}
