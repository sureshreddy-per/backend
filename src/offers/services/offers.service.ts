import { Injectable, Logger, Inject, NotFoundException, forwardRef } from "@nestjs/common";
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
      const offer = this.offerRepository.create({
        ...createOfferDto,
        status: OfferStatus.PENDING,
      });
      const savedOffer = await this.offerRepository.save(offer);

      // Notify the farmer about the new offer
      await this.notificationService.create({
        user_id: savedOffer.farmer_id,
        type: NotificationType.NEW_OFFER,
        data: {
          offer_id: savedOffer.id,
          produce_id: savedOffer.produce_id,
          price_per_unit: savedOffer.price_per_unit,
        },
      });

      return savedOffer;
    } catch (error) {
      this.logger.error(`Error creating offer: ${error.message}`);
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
}
