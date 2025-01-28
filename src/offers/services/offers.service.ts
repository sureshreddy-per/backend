import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Not, In, LessThan, IsNull, Between } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Offer } from '../entities/offer.entity';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { CreateAdminOfferDto } from '../dto/create-admin-offer.dto';
import { ProduceService } from '../../produce/services/produce.service';
import { BuyersService } from '../../buyers/buyers.service';
import { NotificationService } from '../../notifications/services/notification.service';
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

@Injectable()
export class OffersService {
  private readonly logger = new Logger(OffersService.name);

  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly produceService: ProduceService,
    private readonly buyersService: BuyersService,
    private readonly notificationService: NotificationService,
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

  private transformBuyerData(offer: Offer): TransformedBuyer {
    if (!offer.buyer || !offer.buyer.user) {
      return null;
    }

    return {
      id: offer.buyer.id,
      business_name: offer.buyer.business_name,
      address: offer.buyer.address || '',
      location: offer.buyer.location || '',
      name: offer.buyer.user.name,
      avatar_url: offer.buyer.user.avatar_url,
      rating: offer.buyer.user.rating || 0,
      total_completed_transactions: offer.buyer.user.total_completed_transactions || 0
    };
  }

  private async transformOfferResponse(offer: Offer): Promise<Offer> {
    // Load full offer with relations if not already loaded
    if (!offer.buyer?.user || !offer.produce) {
      offer = await this.offerRepository.findOne({
        where: { id: offer.id },
        relations: [
          "produce",
          "produce.farmer",
          "produce.farmer.user",
          "produce.quality_assessments",
          "buyer",
          "buyer.user"
        ],
      });
    }

    // Transform produce data
    if (offer.produce) {
      offer.produce = this.produceService.transformProduceForResponse(offer.produce);
    }

    // Transform buyer data to match required structure
    (offer.buyer as any) = this.transformBuyerData(offer);

    return offer;
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
      await this.notificationService.create({
        user_id: farmer.user_id,
        type: NotificationType.NEW_OFFER,
        data: {
          offer_id: savedOffer.id,
          produce_id: savedOffer.produce_id,
          price_per_unit: savedOffer.price_per_unit,
          quantity: savedOffer.quantity,
          buyer_name: buyer.business_name
        },
      });

      // Return transformed offer
      return this.transformOfferResponse(completeOffer);
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

    const transformedOffer = await this.transformOfferResponse(offer);
    await this.cacheManager.set(cacheKey, transformedOffer, CACHE_TTL);
    return transformedOffer;
  }

  async accept(id: string): Promise<Offer> {
    const offer = await this.findOne(id);

    // First, cancel all other offers for this produce
    const otherOffers = await this.offerRepository.find({
      where: {
        produce_id: offer.produce_id,
        id: Not(id),
        status: In([OfferStatus.PENDING, OfferStatus.ACTIVE, OfferStatus.PRICE_MODIFIED])
      }
    });

    // Cancel other offers in parallel
    await Promise.all(otherOffers.map(async (otherOffer) => {
      otherOffer.status = OfferStatus.CANCELLED;
      otherOffer.cancellation_reason = 'Another offer was accepted';
      await this.offerRepository.save(otherOffer);
      await this.clearOfferCache(otherOffer.id);

      // Notify the buyer about the cancelled offer
      await this.notificationService.create({
        user_id: otherOffer.buyer_id,
        type: NotificationType.OFFER_STATUS_UPDATE,
        data: {
          offer_id: otherOffer.id,
          produce_id: otherOffer.produce_id,
          status: OfferStatus.CANCELLED,
          reason: 'Another offer was accepted',
        },
      });
    }));

    // Now accept the chosen offer
    offer.status = OfferStatus.ACCEPTED;
    const updatedOffer = await this.offerRepository.save(offer);
    await this.clearOfferCache(id);

    // Update produce status to IN_PROGRESS
    await this.produceRepository.update(
      { id: offer.produce_id },
      { status: ProduceStatus.IN_PROGRESS }
    );

    // Notify the buyer about the accepted offer
    await this.notificationService.create({
      user_id: offer.buyer_id,
      type: NotificationType.OFFER_ACCEPTED,
      data: {
        offer_id: offer.id,
        produce_id: offer.produce_id,
      },
    });

    return this.transformOfferResponse(updatedOffer);
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

    return this.transformOfferResponse(updatedOffer);
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

    return this.transformOfferResponse(updatedOffer);
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
    // Apply status filter if provided
    if (status) {
      queryBuilder.andWhere('offer.status = :status', { status });
    }

    // Apply multiple sorting options
    if (sort.length > 0) {
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
            queryBuilder[orderMethod]('offer.price_per_unit * offer.quantity', order);
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
            queryBuilder[orderMethod]('buyerUser.rating', order);
            break;
          case OfferSortBy.FARMER_RATING:
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
      items.map(offer => this.transformOfferResponse(offer))
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
      return Promise.all(offers.map(offer => this.transformOfferResponse(offer)));
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
    return this.transformOfferResponse(updatedOffer);
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

    return this.transformOfferResponse(updatedOffer);
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

      return this.transformOfferResponse(savedOffer);
    } catch (error) {
      this.logger.error(`Error in createAdminOffer: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create admin offer: ' + error.message);
    }
  }

  async findLatestTransactionForProduce(produceId: string): Promise<Transaction> {
    return this.transactionRepository.findOne({
      where: {
        produce_id: produceId,
        status: In([TransactionStatus.IN_PROGRESS, TransactionStatus.PENDING])
      },
      order: { created_at: 'DESC' }
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
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId }
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    transaction.status = TransactionStatus.CANCELLED;
    transaction.metadata = {
      ...transaction.metadata,
      ...metadata,
      cancellation_reason: metadata.reason
    };

    await this.transactionRepository.save(transaction);

    // Notify relevant parties
    await Promise.all([
      this.notificationService.create({
        user_id: transaction.buyer_id,
        type: NotificationType.TRANSACTION_CANCELLED,
        data: {
          transaction_id: transaction.id,
          produce_id: transaction.produce_id,
          status: TransactionStatus.CANCELLED,
          reason: metadata.reason
        }
      }),
      this.notificationService.create({
        user_id: transaction.farmer_id,
        type: NotificationType.TRANSACTION_CANCELLED,
        data: {
          transaction_id: transaction.id,
          produce_id: transaction.produce_id,
          status: TransactionStatus.CANCELLED,
          reason: metadata.reason
        }
      })
    ]);
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

      // Notify the buyer about the cancelled offer
      await this.notificationService.create({
        user_id: offer.buyer_id,
        type: NotificationType.OFFER_STATUS_UPDATE,
        data: {
          offer_id: offer.id,
          produce_id: offer.produce_id,
          status: OfferStatus.CANCELLED,
          reason
        }
      });
    }));
  }
}
