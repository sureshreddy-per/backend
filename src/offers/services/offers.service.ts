import { Injectable, Logger, Inject, NotFoundException, forwardRef, ConflictException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { Offer } from "../entities/offer.entity";
import { OfferStatus } from "../enums/offer-status.enum";
import { CreateOfferDto } from "../dto/create-offer.dto";
import { NotificationService } from "../../notifications/services/notification.service";
import { NotificationType } from "../../notifications/enums/notification-type.enum";
import { PaginatedResponse } from "../../common/interfaces/paginated-response.interface";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ProduceService } from "../../produce/services/produce.service";
import { BuyersService } from "../../buyers/buyers.service";
import { DailyPriceService } from "./daily-price.service";
import { AutoOfferService } from "./auto-offer.service";
import { CreateAdminOfferDto } from '../dto/create-admin-offer.dto';
import { UsersService } from "../../users/services/users.service";

const CACHE_TTL = 3600; // 1 hour
const CACHE_PREFIX = 'offer:';
const BATCH_SIZE = 50;

@Injectable()
export class OffersService {
  private readonly logger = new Logger(OffersService.name);

  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    private readonly produceService: ProduceService,
    private readonly buyersService: BuyersService,
    private readonly notificationService: NotificationService,
    private readonly dailyPriceService: DailyPriceService,
    @Inject(forwardRef(() => AutoOfferService))
    private readonly autoOfferService: AutoOfferService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly usersService: UsersService,
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

  async create(createOfferDto: CreateOfferDto): Promise<Offer> {
    try {
      // Validate produce exists
      const produce = await this.produceService.findOne(createOfferDto.produce_id);
      if (!produce) {
        throw new NotFoundException(`Produce with ID ${createOfferDto.produce_id} not found`);
      }

      // Get farmer details to get user_id
      const farmer = await this.produceService.getFarmerDetails(produce.farmer_id);
      if (!farmer) {
        throw new NotFoundException(`Farmer with ID ${produce.farmer_id} not found`);
      }

      // Validate buyer exists and get buyer ID
      const buyer = await this.buyersService.findByUserId(createOfferDto.buyer_id);
      createOfferDto.buyer_id = buyer.id; // Set the actual buyer ID
      createOfferDto.farmer_id = produce.farmer_id; // Set the farmer ID from the produce

      // Create and save the offer
      const offer = this.offerRepository.create({
        ...createOfferDto,
        status: OfferStatus.PENDING,
      });
      
      const savedOffer = await this.offerRepository.save(offer);

      // Notify the farmer about the new offer using their user_id
      await this.notificationService.create({
        user_id: farmer.user_id, // Use farmer's user_id directly
        type: NotificationType.NEW_OFFER,
        data: {
          offer_id: savedOffer.id,
          produce_id: savedOffer.produce_id,
          price_per_unit: savedOffer.price_per_unit,
          quantity: savedOffer.quantity,
          buyer_name: buyer.business_name
        },
      });

      return savedOffer;
    } catch (error) {
      this.logger.error(`Error creating offer: ${error.message}`);
      if (error.code === '23505') { // Unique violation
        throw new ConflictException('An offer with these details already exists');
      }
      throw error;
    }
  }

  async findOne(id: string): Promise<Offer> {
    const cacheKey = this.getCacheKey(`id:${id}`);
    const cached = await this.cacheManager.get<Offer>(cacheKey);
    if (cached) return cached;

    const offer = await this.offerRepository.findOne({
      where: { id },
      relations: ["produce", "buyer"],
    });

    if (!offer) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }

    await this.cacheManager.set(cacheKey, offer, CACHE_TTL);
    return offer;
  }

  async accept(id: string): Promise<Offer> {
    const offer = await this.findOne(id);
    offer.status = OfferStatus.ACCEPTED;
    const updatedOffer = await this.offerRepository.save(offer);
    await this.clearOfferCache(id);

    // Notify the buyer about the accepted offer
    await this.notificationService.create({
      user_id: offer.buyer_id,
      type: NotificationType.OFFER_ACCEPTED,
      data: {
        offer_id: offer.id,
        produce_id: offer.produce_id,
      },
    });

    return updatedOffer;
  }

  async reject(id: string, reason: string): Promise<Offer> {
    const offer = await this.findOne(id);
    offer.status = OfferStatus.REJECTED;
    offer.rejection_reason = reason;
    const updatedOffer = await this.offerRepository.save(offer);
    await this.clearOfferCache(id);

    // Notify the buyer about the rejected offer
    await this.notificationService.create({
      user_id: offer.buyer_id,
      type: NotificationType.OFFER_REJECTED,
      data: {
        offer_id: offer.id,
        produce_id: offer.produce_id,
        reason,
      },
    });

    return updatedOffer;
  }

  async cancel(id: string, reason: string): Promise<Offer> {
    const offer = await this.findOne(id);
    offer.status = OfferStatus.CANCELLED;
    offer.cancellation_reason = reason;
    const updatedOffer = await this.offerRepository.save(offer);
    await this.clearOfferCache(id);

    // Notify both parties about the cancelled offer
    await Promise.all([
      this.notificationService.create({
        user_id: offer.buyer_id,
        type: NotificationType.OFFER_STATUS_UPDATE,
        data: {
          offer_id: offer.id,
          produce_id: offer.produce_id,
          status: OfferStatus.CANCELLED,
          reason,
        },
      }),
      this.notificationService.create({
        user_id: offer.farmer_id,
        type: NotificationType.OFFER_STATUS_UPDATE,
        data: {
          offer_id: offer.id,
          produce_id: offer.produce_id,
          status: OfferStatus.CANCELLED,
          reason,
        },
      }),
    ]);

    return updatedOffer;
  }

  async findByBuyer(buyerId: string, options: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<Offer>> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const cacheKey = this.getCacheKey(`buyer:${buyerId}:${page}:${limit}`);
    const cached = await this.cacheManager.get<PaginatedResponse<Offer>>(cacheKey);
    if (cached) return cached;

    const [items, total] = await this.offerRepository.findAndCount({
      where: { buyer_id: buyerId },
      relations: ["produce", "buyer"],
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    const result = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await this.cacheManager.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async findByFarmer(farmerId: string, options: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<Offer>> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const cacheKey = this.getCacheKey(`farmer:${farmerId}:${page}:${limit}`);
    const cached = await this.cacheManager.get<PaginatedResponse<Offer>>(cacheKey);
    if (cached) return cached;

    const [items, total] = await this.offerRepository
      .createQueryBuilder("offer")
      .innerJoinAndSelect("offer.produce", "produce")
      .innerJoinAndSelect("offer.buyer", "buyer")
      .where("produce.farmer_id = :farmerId", { farmerId })
      .orderBy("offer.created_at", "DESC")
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const result = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await this.cacheManager.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async updateStatus(id: string, status: OfferStatus): Promise<Offer> {
    const offer = await this.findOne(id);
    offer.status = status;
    const updatedOffer = await this.offerRepository.save(offer);
    await this.clearOfferCache(id);
    return updatedOffer;
  }

  async getStats() {
    const cacheKey = this.getCacheKey('stats');
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    const stats = await this.offerRepository
      .createQueryBuilder("offer")
      .select("offer.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("offer.status")
      .getRawMany();

    const result = {
      total: 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
      cancelled: 0,
    };

    stats.forEach(stat => {
      const count = parseInt(stat.count);
      result.total += count;
      switch (stat.status) {
        case OfferStatus.PENDING:
          result.pending = count;
          break;
        case OfferStatus.ACCEPTED:
          result.accepted = count;
          break;
        case OfferStatus.REJECTED:
          result.rejected = count;
          break;
        case OfferStatus.CANCELLED:
          result.cancelled = count;
          break;
      }
    });

    await this.cacheManager.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async findAll(): Promise<Offer[]> {
    return this.offerRepository.find({
      relations: ["produce", "buyer"],
      order: { created_at: "DESC" },
    });
  }

  async remove(id: string): Promise<void> {
    const offer = await this.findOne(id);
    await this.offerRepository.remove(offer);
    await this.clearOfferCache(id);
  }

  async overridePrice(id: string, newPrice: number): Promise<Offer> {
    const offer = await this.findOne(id);
    offer.price_per_unit = newPrice;
    const updatedOffer = await this.offerRepository.save(offer);
    await this.clearOfferCache(id);

    // Notify both parties about the price update
    await Promise.all([
      this.notificationService.create({
        user_id: offer.buyer_id,
        type: NotificationType.OFFER_PRICE_UPDATE,
        data: {
          offer_id: offer.id,
          produce_id: offer.produce_id,
          new_price: newPrice,
        },
      }),
      this.notificationService.create({
        user_id: offer.farmer_id,
        type: NotificationType.OFFER_PRICE_UPDATE,
        data: {
          offer_id: offer.id,
          produce_id: offer.produce_id,
          new_price: newPrice,
        },
      }),
    ]);

    return updatedOffer;
  }

  async handlePriceChange(
    produce_id: string,
    new_price: number,
  ): Promise<void> {
    try {
      // Find all active offers for this produce
      const offers = await this.offerRepository.find({
        where: {
          produce_id,
          status: OfferStatus.PENDING,
        },
      });

      // Update each offer with the new price
      for (const offer of offers) {
        offer.price_per_unit = new_price;
        await this.offerRepository.save(offer);

        // Emit event for each updated offer
        this.eventEmitter.emit('offer.price.updated', {
          offer_id: offer.id,
          produce_id,
          old_price: offer.price_per_unit,
          new_price,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Error in handlePriceChange:', error);
      throw error;
    }
  }

  async createAdminOffer(createAdminOfferDto: CreateAdminOfferDto): Promise<Offer> {
    try {
      // Validate that buyer exists and is a BUYER
      const buyer = await this.usersService.findOne(createAdminOfferDto.buyer_id);
      if (!buyer || buyer.role !== 'BUYER') {
        throw new BadRequestException('Invalid buyer ID or user is not a buyer');
      }

      // Validate that farmer exists and is a FARMER
      const farmer = await this.usersService.findOne(createAdminOfferDto.farmer_id);
      if (!farmer || farmer.role !== 'FARMER') {
        throw new BadRequestException('Invalid farmer ID or user is not a farmer');
      }

      // Validate that produce exists and belongs to the farmer
      const produce = await this.produceService.findOne(createAdminOfferDto.produce_id);
      if (!produce) {
        throw new BadRequestException('Invalid produce ID');
      }
      if (produce.farmer_id !== createAdminOfferDto.farmer_id) {
        throw new BadRequestException('Produce does not belong to the specified farmer');
      }

      // Validate produce availability
      if (produce.quantity < createAdminOfferDto.quantity) {
        throw new BadRequestException('Requested quantity exceeds available produce quantity');
      }

      // Convert admin DTO to full offer DTO with default values
      const fullOfferDto: CreateOfferDto = {
        ...createAdminOfferDto,
        buyer_min_price: createAdminOfferDto.price_per_unit,
        buyer_max_price: createAdminOfferDto.price_per_unit,
        quality_grade: produce.quality_grade || 5,
        distance_km: 0,
        inspection_fee: 0,
        metadata: {
          created_by_admin: true,
          admin_created_at: new Date().toISOString(),
          produce_name: produce.name,
          buyer_name: buyer.name,
          farmer_name: farmer.name
        }
      };

      const offer = this.offerRepository.create({
        ...fullOfferDto,
        status: OfferStatus.PENDING,
      });

      const savedOffer = await this.offerRepository.save(offer);

      // Notify both buyer and farmer about the admin-created offer
      await Promise.all([
        this.notificationService.create({
          user_id: buyer.id,
          type: NotificationType.NEW_OFFER,
          data: {
            offer_id: savedOffer.id,
            produce_id: savedOffer.produce_id,
            price_per_unit: savedOffer.price_per_unit,
            quantity: savedOffer.quantity,
            message: 'An administrator has created this offer on your behalf'
          },
        }),
        this.notificationService.create({
          user_id: farmer.id,
          type: NotificationType.NEW_OFFER,
          data: {
            offer_id: savedOffer.id,
            produce_id: savedOffer.produce_id,
            price_per_unit: savedOffer.price_per_unit,
            quantity: savedOffer.quantity,
            message: 'An administrator has created this offer'
          },
        }),
      ]);

      // Emit event for offer creation
      this.eventEmitter.emit('offer.created', {
        offer_id: savedOffer.id,
        created_by: 'admin',
        timestamp: new Date(),
      });

      return savedOffer;
    } catch (error) {
      this.logger.error(`Error in createAdminOffer: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create admin offer: ' + error.message);
    }
  }
}
