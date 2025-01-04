import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BuyerPrice } from '../entities/buyer-price.entity';
import { CreateBuyerPriceDto } from '../dto/create-buyer-price.dto';
import { UpdateBuyerPriceDto } from '../dto/update-buyer-price.dto';
import { AutoOfferManagerService } from '../../offers/services/auto-offer-manager.service';

@Injectable()
export class BuyerPricesService {
  constructor(
    @InjectRepository(BuyerPrice)
    private readonly buyerPriceRepository: Repository<BuyerPrice>,
    private readonly autoOfferManager: AutoOfferManagerService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createBuyerPriceDto: CreateBuyerPriceDto): Promise<BuyerPrice> {
    // Deactivate any existing active price for the same grade
    await this.buyerPriceRepository.update(
      {
        buyerId: createBuyerPriceDto.buyerId,
        qualityGrade: createBuyerPriceDto.qualityGrade,
        isActive: true,
      },
      { isActive: false }
    );

    const buyerPrice = this.buyerPriceRepository.create(createBuyerPriceDto);
    const savedPrice = await this.buyerPriceRepository.save(buyerPrice);

    // Emit event for auto-offer generation
    this.eventEmitter.emit('buyer.price.created', {
      buyerId: savedPrice.buyerId,
      price: savedPrice,
    });

    return savedPrice;
  }

  async update(id: string, updateBuyerPriceDto: UpdateBuyerPriceDto): Promise<BuyerPrice> {
    const buyerPrice = await this.buyerPriceRepository.findOne({
      where: { id },
    });

    if (!buyerPrice) {
      throw new NotFoundException(`Buyer price with ID ${id} not found`);
    }

    const oldPrice = buyerPrice.pricePerUnit;
    Object.assign(buyerPrice, updateBuyerPriceDto);
    
    const updatedPrice = await this.buyerPriceRepository.save(buyerPrice);

    // Handle auto-offer expiry if price has changed
    if (oldPrice !== updatedPrice.pricePerUnit) {
      await this.autoOfferManager.handlePriceChange(
        buyerPrice.buyerId,
        buyerPrice.qualityGrade,
        oldPrice,
        updatedPrice.pricePerUnit
      );
    }

    return updatedPrice;
  }

  async findByBuyer(buyerId: string, options: {
    date?: Date;
    grade?: string;
    active?: boolean;
  } = {}): Promise<BuyerPrice[]> {
    const query = this.buyerPriceRepository
      .createQueryBuilder('buyerPrice')
      .where('buyerPrice.buyerId = :buyerId', { buyerId });

    if (options.date) {
      query.andWhere('buyerPrice.effectiveDate <= :date', { date: options.date });
    }

    if (options.grade) {
      query.andWhere('buyerPrice.qualityGrade = :grade', { grade: options.grade });
    }

    if (typeof options.active === 'boolean') {
      query.andWhere('buyerPrice.isActive = :active', { active: options.active });
    }

    return query.getMany();
  }

  async getCurrentPrices(buyerId: string, grade?: string): Promise<BuyerPrice[]> {
    const query = this.buyerPriceRepository
      .createQueryBuilder('buyerPrice')
      .where('buyerPrice.buyerId = :buyerId', { buyerId })
      .andWhere('buyerPrice.isActive = :active', { active: true })
      .andWhere('buyerPrice.effectiveDate <= :now', { now: new Date() });

    if (grade) {
      query.andWhere('buyerPrice.qualityGrade = :grade', { grade });
    }

    return query.getMany();
  }

  async getPriceHistory(
    buyerId: string,
    grade?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<BuyerPrice[]> {
    const query = this.buyerPriceRepository
      .createQueryBuilder('buyerPrice')
      .where('buyerPrice.buyerId = :buyerId', { buyerId });

    if (grade) {
      query.andWhere('buyerPrice.qualityGrade = :grade', { grade });
    }

    if (startDate && endDate) {
      query.andWhere('buyerPrice.effectiveDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      query.andWhere('buyerPrice.effectiveDate >= :startDate', { startDate });
    } else if (endDate) {
      query.andWhere('buyerPrice.effectiveDate <= :endDate', { endDate });
    }

    query.orderBy('buyerPrice.effectiveDate', 'DESC');
    return query.getMany();
  }

  async findAllActiveByGrade(qualityGrade: string, date: Date): Promise<BuyerPrice[]> {
    return this.buyerPriceRepository.find({
      where: {
        qualityGrade,
        isActive: true,
        effectiveDate: LessThanOrEqual(date)
      },
      order: {
        effectiveDate: 'DESC'
      }
    });
  }
} 