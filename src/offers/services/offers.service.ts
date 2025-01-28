import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Not, In, LessThan, IsNull, Between, EntityManager } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OfferAcceptedEvent } from '../events/offer-accepted.event';

import { Offer } from '../entities/offer.entity';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { CreateAdminOfferDto } from '../dto/create-admin-offer.dto';
import { ProduceService } from '../../produce/services/produce.service';
import { BuyersService } from '../../buyers/services/buyers.service';
import { AutoOfferService } from './auto-offer.service';
import { NotificationType } from '../../notifications/enums/notification-type.enum';
import { OfferStatus } from '../enums/offer-status.enum';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { UsersService } from '../../users/services/users.service';
import { ListOffersDto, OfferSortBy } from '../dto/list-offers.dto';
import { Produce } from '../../produce/entities/produce.entity';
import { ProduceStatus } from '../../produce/enums/produce-status.enum';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { TransactionStatus } from '../../transactions/entities/transaction.entity';
import { FarmersService } from '../../farmers/farmers.service';
import { TransactionHistoryService } from '../../transactions/services/transaction-history.service';
import { TransactionEvent } from '../../transactions/entities/transaction-history.entity';
import { OfferTransformationService } from './offer-transformation.service';

interface TransformedBuyer {
  id: string;
  business_name: string;
  address: string;
  location: string;
  name: string;
  avatar_url: string | null;
  rating: number;
  total_completed_transactions: number;
}

const CACHE_PREFIX = 'offers:';
const CACHE_TTL = 300; // 5 minutes

// Add new event type
export interface TransactionExpiredEvent {
  transaction_id: string;
}

// Add new event type
export interface GetLatestTransactionEvent {
  user_id: string;
  role: 'BUYER' | 'FARMER';
}

@Injectable()
export class OffersService {
  private readonly logger = new Logger(OffersService.name);

  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>,
    private readonly buyersService: BuyersService,
    private readonly farmersService: FarmersService,
    private readonly usersService: UsersService,
    private readonly produceService: ProduceService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @Inject(forwardRef(() => AutoOfferService))
    private readonly autoOfferService: AutoOfferService,
    private readonly offerTransformationService: OfferTransformationService,
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

  private async notifyUser(userId: string, type: NotificationType, data: Record<string, any>) {
    try {
      this.eventEmitter.emit('notification.create', {
        user_id: userId,
        type,
        data,
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit notification event for user ${userId}, type ${type}: ${error.message}`,
        error.stack
      );
      // Don't throw error as notifications are non-critical
    }
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

      // Check for existing offer
      const existingOffer = await this.offerRepository.findOne({
        where: {
          produce_id: createOfferDto.produce_id,
          buyer_id: createOfferDto.buyer_id,
          farmer_id: createOfferDto.farmer_id,
          status: Not(In([OfferStatus.REJECTED, OfferStatus.CANCELLED]))
        }
      });

      if (existingOffer) {
        throw new ConflictException('An active offer already exists for this produce, buyer, and farmer combination');
      }

      // Create and save the offer
      const offer = this.offerRepository.create({
        ...createOfferDto,
        status: OfferStatus.PENDING,
      });

      const savedOffer = await this.offerRepository.save(offer);

      // Fetch the complete offer with all relations before transforming
      const completeOffer = await this.offerRepository.findOne({
        where: { id: savedOffer.id },
        relations: [
          "produce",
          "produce.farmer",
          "produce.farmer.user",
          "produce.quality_assessments",
          "buyer",
          "buyer.user"
        ],
      });

      // Get buyer details for notification
      const buyer = await this.buyersService.findOne(createOfferDto.buyer_id);

      // Notify the farmer about the new offer
      await this.notifyUser(farmer.user_id, NotificationType.NEW_OFFER, {
        offer_id: savedOffer.id,
        produce_id: savedOffer.produce_id,
        price_per_unit: savedOffer.price_per_unit,
        quantity: savedOffer.quantity,
        buyer_name: buyer.business_name,
        message: 'New offer received',
        status: OfferStatus.PENDING
      });

      // Return transformed offer
      return this.offerTransformationService.transformOffer(completeOffer);
    } catch (error) {
      this.logger.error(`Error creating offer: ${error.message}`);
      if (error.code === '23505') {
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
      relations: [
        "produce",
        "produce.farmer",
        "produce.farmer.user",
        "produce.quality_assessments",
        "buyer",
        "buyer.user"
      ],
    });

    if (!offer) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }

    const transformedOffer = this.offerTransformationService.transformOffer(offer);
    await this.cacheManager.set(cacheKey, transformedOffer, CACHE_TTL);
    return transformedOffer;
  }

  async accept(id: string): Promise<Offer> {
    return await this.offerRepository.manager.transaction(async transactionalEntityManager => {
      // 1. Get and lock the offer with pessimistic lock
      const offer = await transactionalEntityManager
        .createQueryBuilder(Offer, "offer")
        .setLock("pessimistic_write")
        .where("offer.id = :id AND offer.status IN (:...statuses)", {
          id,
          statuses: [OfferStatus.PENDING, OfferStatus.ACTIVE]
        })
        .getOne();

      if (!offer) {
        throw new ConflictException("Offer is no longer available for acceptance");
      }

      // 2. Validate offer data
      if (isNaN(Number(offer.price_per_unit)) || Number(offer.price_per_unit) <= 0) {
        throw new BadRequestException("Invalid price in offer");
      }
      if (isNaN(Number(offer.quantity)) || Number(offer.quantity) <= 0) {
        throw new BadRequestException("Invalid quantity in offer");
      }

      // 3. Get and validate buyer with status check
      const buyer = await this.buyersService.findOne(offer.buyer_id);
      if (!buyer) {
        throw new NotFoundException(`Buyer with ID ${offer.buyer_id} not found`);
      }
      if (!buyer.is_active) {
        throw new ConflictException("Buyer account is not active");
      }

      // 4. Verify produce availability
      const produce = await transactionalEntityManager.findOne(Produce, {
        where: {
          id: offer.produce_id,
          status: ProduceStatus.AVAILABLE
        }
      });

      if (!produce) {
        throw new ConflictException("Produce is no longer available");
      }

      // 5. Cancel other offers
      try {
        const otherOffers = await transactionalEntityManager.find(Offer, {
          where: {
            produce_id: offer.produce_id,
            id: Not(id),
            status: In([OfferStatus.PENDING, OfferStatus.ACTIVE, OfferStatus.PRICE_MODIFIED])
          }
        });

        await Promise.all(otherOffers.map(async (otherOffer) => {
          otherOffer.status = OfferStatus.CANCELLED;
          otherOffer.cancellation_reason = 'Another offer was accepted';
          await transactionalEntityManager.save(Offer, otherOffer);

          try {
            await this.clearOfferCacheWithRetry(otherOffer.id);
          } catch (error) {
            this.logger.error(`Failed to clear cache for offer ${otherOffer.id}`, error);
          }

          try {
            const otherBuyer = await this.buyersService.findOne(otherOffer.buyer_id);
            if (otherBuyer) {
              await this.notifyUser(otherBuyer.user_id, NotificationType.OFFER_STATUS_UPDATE, {
                offer_id: otherOffer.id,
                produce_id: otherOffer.produce_id,
                status: OfferStatus.CANCELLED,
                reason: 'Another offer was accepted',
              });
            }
          } catch (error) {
            this.logger.error(`Failed to notify buyer for cancelled offer ${otherOffer.id}`, error);
          }
        }));
      } catch (error) {
        this.logger.error('Error while cancelling other offers', error);
        throw new ConflictException("Failed to process offer acceptance");
      }

      // 6. Update offer status
      offer.status = OfferStatus.ACCEPTED;
      const updatedOffer = await transactionalEntityManager.save(Offer, offer);

      try {
        await this.clearOfferCacheWithRetry(id);
      } catch (error) {
        this.logger.error(`Failed to clear cache for accepted offer ${id}`, error);
      }

      produce.status = ProduceStatus.IN_PROGRESS;
      await transactionalEntityManager.save(Produce, produce);

      // Get farmer details
      const farmer = await this.farmersService.findOne(offer.farmer_id);
      if (!farmer) {
        throw new NotFoundException(`Farmer with ID ${offer.farmer_id} not found`);
      }

      // 7. Emit offer accepted event
      const offerAcceptedEvent: OfferAcceptedEvent = {
        offer: {
          id: String(offer.id),
          produce_id: String(offer.produce_id),
          price_per_unit: Number(offer.price_per_unit),
          quantity: Number(offer.quantity)
        },
        buyer: {
          id: String(offer.buyer_id),
          user_id: buyer.user_id
        },
        farmer: {
          id: String(offer.farmer_id),
          user_id: farmer.user_id
        }
      };

      this.logger.log(`Emitting offer.accepted event for offer ${offer.id}`);
      this.eventEmitter.emit('offer.accepted', offerAcceptedEvent);
      this.logger.log(`Emitted offer.accepted event for offer ${offer.id}`);

      // Return transformed offer using transformation service
      return this.offerTransformationService.transformOffer(updatedOffer, transactionalEntityManager);
    });
  }

  // Add helper method for cache clearing with retry
  private async clearOfferCacheWithRetry(id: string, retries = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await this.clearOfferCache(id);
        return;
      } catch (error) {
        this.logger.warn(`Failed to clear cache for offer ${id}, attempt ${i + 1}`, error);
        if (i === retries - 1) throw error;
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  async reject(id: string, reason: string): Promise<Offer> {
    return await this.offerRepository.manager.transaction(async transactionalEntityManager => {
      // 1. Get and validate offer using transaction manager
      const offer = await transactionalEntityManager.findOne(Offer, {
        where: { id }
      });

      if (!offer) {
        throw new NotFoundException(`Offer with ID ${id} not found`);
      }

      // 2. Get and validate buyer with user relation
      const buyer = await this.buyersService.findOne(offer.buyer_id);
      if (!buyer) {
        throw new NotFoundException(`Buyer with ID ${offer.buyer_id} not found`);
      }

      if (!buyer.user_id) {
        throw new BadRequestException(`Buyer ${buyer.id} has no associated user ID`);
      }

      // 3. Get and update produce status
      const produce = await transactionalEntityManager.findOne(Produce, {
        where: { id: offer.produce_id }
      });

      if (!produce) {
        throw new NotFoundException(`Produce with ID ${offer.produce_id} not found`);
      }

      // 4. Update offer status
      offer.status = OfferStatus.REJECTED;
      offer.rejection_reason = reason;
      const updatedOffer = await transactionalEntityManager.save(Offer, offer);
      await this.clearOfferCache(id);

      // 5. Update produce status back to AVAILABLE
      produce.status = ProduceStatus.AVAILABLE;
      await transactionalEntityManager.save(Produce, produce);

      // 6. Notify the buyer about the rejected offer
      try {
        this.logger.log(`Sending rejection notification to buyer user ${buyer.user_id}`);
        await this.notifyUser(buyer.user_id, NotificationType.OFFER_STATUS_UPDATE, {
          offer_id: offer.id,
          produce_id: offer.produce_id,
          previous_status: OfferStatus.PENDING,
          status: OfferStatus.REJECTED,
          reason,
          message: 'Offer has been rejected',
          updated_at: new Date()
        });
      } catch (error) {
        this.logger.error(`Failed to send rejection notification to buyer ${buyer.user_id}`, error);
      }

      // 7. Trigger auto-offer recalculation
      try {
        this.eventEmitter.emit('offer.rejected', {
          offer_id: offer.id,
          produce_id: offer.produce_id,
          rejected_at: new Date(),
          reason: reason
        });

        // Emit event for auto-offer recalculation
        this.eventEmitter.emit('produce.available', {
          produce_id: produce.id,
          event_type: 'offer_rejected',
          timestamp: new Date()
        });
      } catch (error) {
        this.logger.error(`Failed to trigger auto-offers recalculation for produce ${offer.produce_id}`, error);
        // Don't throw error as this is a non-critical operation
      }

      // Return transformed offer using transformation service
      return this.offerTransformationService.transformOffer(updatedOffer, transactionalEntityManager);
    });
  }

  async cancel(id: string, reason: string): Promise<Offer> {
    return await this.offerRepository.manager.transaction(async transactionalEntityManager => {
      // 1. Get and validate offer using transaction manager
      const offer = await transactionalEntityManager.findOne(Offer, {
        where: { id }
      });

      if (!offer) {
        throw new NotFoundException(`Offer with ID ${id} not found`);
      }

      // 2. Get and validate buyer and farmer
      const [buyer, farmer] = await Promise.all([
        this.buyersService.findOne(offer.buyer_id),
        this.farmersService.findOne(offer.farmer_id)
      ]);

      if (!buyer) {
        throw new NotFoundException(`Buyer with ID ${offer.buyer_id} not found`);
      }

      if (!farmer) {
        throw new NotFoundException(`Farmer with ID ${offer.farmer_id} not found`);
      }

      // 3. Get and update produce status
      const produce = await transactionalEntityManager.findOne(Produce, {
        where: { id: offer.produce_id }
      });

      if (!produce) {
        throw new NotFoundException(`Produce with ID ${offer.produce_id} not found`);
      }

      // 4. Update offer status
      offer.status = OfferStatus.CANCELLED;
      offer.cancellation_reason = reason;
      const updatedOffer = await transactionalEntityManager.save(Offer, offer);
      await this.clearOfferCache(id);

      // 5. Update produce status back to AVAILABLE
      produce.status = ProduceStatus.AVAILABLE;
      await transactionalEntityManager.save(Produce, produce);

      // 6. Notify both parties about the cancelled offer
      try {
        const notificationData = {
          offer_id: offer.id,
          produce_id: offer.produce_id,
          previous_status: offer.status,
          status: OfferStatus.CANCELLED,
          reason,
          message: 'Offer has been cancelled',
          updated_at: new Date()
        };

        await Promise.all([
          this.notifyUser(buyer.user_id, NotificationType.OFFER_STATUS_UPDATE, notificationData),
          this.notifyUser(farmer.user_id, NotificationType.OFFER_STATUS_UPDATE, notificationData)
        ]);
      } catch (error) {
        this.logger.error(`Failed to send cancellation notifications for offer ${offer.id}`, error);
      }

      // 7. Trigger auto-offer recalculation
      try {
        this.eventEmitter.emit('offer.cancelled', {
          offer_id: offer.id,
          produce_id: offer.produce_id,
          cancelled_at: new Date(),
          reason: reason
        });

        // Emit event for auto-offer recalculation
        this.eventEmitter.emit('produce.available', {
          produce_id: produce.id,
          event_type: 'offer_cancelled',
          timestamp: new Date()
        });
      } catch (error) {
        this.logger.error(`Failed to trigger auto-offers recalculation for produce ${offer.produce_id}`, error);
        // Don't throw error as this is a non-critical operation
      }

      // Return transformed offer using transformation service
      return this.offerTransformationService.transformOffer(updatedOffer, transactionalEntityManager);
    });
  }

  private createBaseQuery(): SelectQueryBuilder<Offer> {
    return this.offerRepository
      .createQueryBuilder('offer')
      .leftJoinAndSelect('offer.produce', 'produce')
      .leftJoinAndSelect('produce.farmer', 'farmer')
      .leftJoinAndSelect('farmer.user', 'farmerUser')
      .leftJoinAndSelect('produce.quality_assessments', 'quality_assessments')
      .leftJoinAndSelect('offer.buyer', 'buyer')
      .leftJoinAndSelect('buyer.user', 'buyerUser');
  }

  private buildOffersQuery(
    queryBuilder: SelectQueryBuilder<Offer>,
    { status, sort = [] }: ListOffersDto
  ): SelectQueryBuilder<Offer> {
    if (status) {
      queryBuilder.andWhere('offer.status = :status', { status });
    }

    if (sort && sort.length > 0) {
      sort.forEach((sortOption, index) => {
        const { field, order } = sortOption;

        // For the first sort option, use orderBy
        // For subsequent options, use addOrderBy
        const orderMethod = index === 0 ? 'orderBy' : 'addOrderBy';

        switch (field) {
          case OfferSortBy.PRICE_PER_UNIT:
            queryBuilder[orderMethod]('offer.price_per_unit', order);
            break;
          case OfferSortBy.TOTAL_PRICE:
            // Add total_price as a computed column in the SELECT
            queryBuilder.addSelect('offer.price_per_unit * offer.quantity', 'total_price');
            queryBuilder[orderMethod]('total_price', order);
            break;
          case OfferSortBy.QUANTITY:
            queryBuilder[orderMethod]('offer.quantity', order);
            break;
          case OfferSortBy.QUALITY:
            queryBuilder[orderMethod]('offer.quality_grade', order);
            break;
          case OfferSortBy.DISTANCE:
            queryBuilder[orderMethod]('offer.distance_km', order);
            break;
          case OfferSortBy.BUYER_RATING:
            // Use the already joined buyer and user relations
            queryBuilder[orderMethod]('buyerUser.rating', order);
            break;
          case OfferSortBy.FARMER_RATING:
            // Use the already joined farmer and user relations
            queryBuilder[orderMethod]('farmerUser.rating', order);
            break;
          default:
            queryBuilder[orderMethod]('offer.created_at', order);
        }
      });
    } else {
      // Default sorting if no sort options provided
      queryBuilder.orderBy('offer.created_at', 'DESC');
    }

    return queryBuilder;
  }

  private async getPaginatedOffers(
    queryBuilder: SelectQueryBuilder<Offer>,
    query: ListOffersDto
  ): Promise<PaginatedResponse<Offer>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const finalQuery = this.buildOffersQuery(queryBuilder, query);
    const [items, total] = await finalQuery
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const transformedItems = await Promise.all(
      items.map(offer => this.offerTransformationService.transformOffer(offer))
    );

    return {
      items: transformedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAll(query?: ListOffersDto): Promise<PaginatedResponse<Offer> | Offer[]> {
    const queryBuilder = this.createBaseQuery();

    // If no query params provided, return all offers without pagination
    if (!query) {
      const offers = await queryBuilder
        .orderBy('offer.created_at', 'DESC')
        .getMany();
      return Promise.all(offers.map(offer => this.offerTransformationService.transformOffer(offer)));
    }

    // Return paginated response with filters and sorting
    return this.getPaginatedOffers(queryBuilder, query);
  }

  async findByBuyer(buyerId: string, query: ListOffersDto): Promise<PaginatedResponse<Offer>> {
    const queryBuilder = this.createBaseQuery()
      .where('offer.buyer_id = :buyerId', { buyerId });
    return this.getPaginatedOffers(queryBuilder, query);
  }

  async findByFarmer(farmerId: string, query: ListOffersDto): Promise<PaginatedResponse<Offer>> {
    const queryBuilder = this.createBaseQuery()
      .where('produce.farmer_id = :farmerId', { farmerId });
    return this.getPaginatedOffers(queryBuilder, query);
  }

  async updateStatus(id: string, status: OfferStatus): Promise<Offer> {
    const offer = await this.findOne(id);
    offer.status = status;
    const updatedOffer = await this.offerRepository.save(offer);
    await this.clearOfferCache(id);
    return this.offerTransformationService.transformOffer(updatedOffer);
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

  async remove(id: string): Promise<void> {
    const offer = await this.findOne(id);
    await this.offerRepository.remove(offer);
    await this.clearOfferCache(id);
  }

  async overridePrice(id: string, newPrice: number): Promise<Offer> {
    return await this.offerRepository.manager.transaction(async transactionalEntityManager => {
      const offer = await this.findOne(id);

      // Get the buyer and farmer details to get their user_ids
      const [buyer, farmer] = await Promise.all([
        this.buyersService.findOne(offer.buyer_id),
        this.farmersService.findOne(offer.farmer_id)
      ]);

      if (!buyer) {
        throw new NotFoundException(`Buyer with ID ${offer.buyer_id} not found`);
      }

      if (!farmer) {
        throw new NotFoundException(`Farmer with ID ${offer.farmer_id} not found`);
      }

      // If offer was accepted, get and update produce status
      if (offer.status === OfferStatus.ACCEPTED) {
        const produce = await this.produceRepository.findOne({
          where: { id: offer.produce_id }
        });

        if (!produce) {
          throw new NotFoundException(`Produce with ID ${offer.produce_id} not found`);
        }

        // Update produce status back to AVAILABLE
        produce.status = ProduceStatus.AVAILABLE;
        await transactionalEntityManager.save(Produce, produce);

        // Update offer status to PRICE_MODIFIED
        offer.status = OfferStatus.PRICE_MODIFIED;
      }

      offer.price_per_unit = newPrice;
      offer.is_price_overridden = true;
      offer.price_override_at = new Date();

      // Add to price history
      if (!offer.metadata) {
        offer.metadata = { price_history: [] };
      } else if (!offer.metadata.price_history) {
        offer.metadata.price_history = [];
      }

      offer.metadata.price_history.push({
        price: newPrice,
        timestamp: new Date(),
        reason: 'Price modified by buyer'
      });

      const updatedOffer = await transactionalEntityManager.save(Offer, offer);
      await this.clearOfferCache(id);

      // Notify both parties about the price update
      try {
        const notificationData = {
          offer_id: offer.id,
          produce_id: offer.produce_id,
          price_per_unit: newPrice,
          previous_price: offer.price_per_unit,
          previous_status: OfferStatus.ACCEPTED,
          status: OfferStatus.PRICE_MODIFIED,
          message: 'Offer price has been updated',
          updated_at: new Date()
        };

        await Promise.all([
          this.notifyUser(buyer.user_id, NotificationType.OFFER_PRICE_UPDATE, notificationData),
          this.notifyUser(farmer.user_id, NotificationType.OFFER_PRICE_UPDATE, notificationData),
        ]);
      } catch (error) {
        this.logger.error(`Failed to send price update notifications for offer ${offer.id}`, error);
      }

      return this.offerTransformationService.transformOffer(updatedOffer, transactionalEntityManager);
    });
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
        this.notifyUser(buyer.id, NotificationType.NEW_OFFER, {
          offer_id: savedOffer.id,
          produce_id: savedOffer.produce_id,
          price_per_unit: savedOffer.price_per_unit,
          quantity: savedOffer.quantity,
          message: 'An administrator has created this offer on your behalf',
          status: OfferStatus.PENDING,
          created_by: 'admin'
        }),
        this.notifyUser(farmer.id, NotificationType.NEW_OFFER, {
          offer_id: savedOffer.id,
          produce_id: savedOffer.produce_id,
          price_per_unit: savedOffer.price_per_unit,
          quantity: savedOffer.quantity,
          message: 'An administrator has created this offer',
          status: OfferStatus.PENDING,
          created_by: 'admin'
        }),
      ]);

      // Emit event for offer creation
      this.eventEmitter.emit('offer.created', {
        offer_id: savedOffer.id,
        created_by: 'admin',
        timestamp: new Date(),
      });

      return this.offerTransformationService.transformOffer(savedOffer);
    } catch (error) {
      this.logger.error(`Error in createAdminOffer: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create admin offer: ' + error.message);
    }
  }

  async findLatestTransactionForProduce(produceId: string): Promise<Transaction | null> {
    return new Promise((resolve) => {
      // Set up one-time listener for the response
      this.eventEmitter.once('produce.transaction.latest.response', (response) => {
        if (response.produce_id === produceId) {
          resolve(response.transaction);
        }
      });

      // Emit request event
      this.eventEmitter.emit('produce.transaction.latest.requested', {
        produce_id: produceId
      });

      // Set timeout for response
      setTimeout(() => {
        resolve(null);
      }, 5000); // 5 second timeout
    });
  }

  async markTransactionAsExpired(
    transactionId: string,
    metadata: {
      reason: string;
      reactivated_at: Date;
      reactivated_by: string;
    }
  ): Promise<void> {
    // Emit event instead of direct transaction update
    const event: TransactionExpiredEvent = {
      transaction_id: transactionId
    };

    this.eventEmitter.emit('transaction.expired', event);
  }

  async cancelAllOffersForProduce(produceId: string, reason: string): Promise<void> {
    const offers = await this.offerRepository.find({
      where: {
        produce_id: produceId,
        status: In([OfferStatus.PENDING, OfferStatus.ACTIVE, OfferStatus.PRICE_MODIFIED])
      }
    });

    await Promise.all(offers.map(async (offer) => {
      offer.status = OfferStatus.CANCELLED;
      offer.cancellation_reason = reason;
      await this.offerRepository.save(offer);
      await this.clearOfferCache(offer.id);

      // Get the buyer details for notification
      const buyer = await this.buyersService.findOne(offer.buyer_id);
      if (buyer) {
        // Notify the buyer about the cancelled offer
        await this.notifyUser(buyer.user_id, NotificationType.OFFER_STATUS_UPDATE, {
          offer_id: offer.id,
          produce_id: offer.produce_id,
          status: OfferStatus.CANCELLED,
          reason
        });
      }
    }));
  }
}
