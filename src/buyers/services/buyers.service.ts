import { NotFoundException } from '@nestjs/common';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Buyer } from '../entities/buyer.entity';
import { BuyerPreferences } from '../entities/buyer-preferences.entity';

@Injectable()
export class BuyersService {
  private readonly logger = new Logger(BuyersService.name);

  constructor(
    @InjectRepository(Buyer)
    private readonly buyerRepository: Repository<Buyer>,
    @InjectRepository(BuyerPreferences)
    private readonly buyerPreferencesRepository: Repository<BuyerPreferences>,
  ) {}

  async getBuyerDetails(userId: string): Promise<any> {
    const buyerWithCounts = await this.buyerRepository
      .createQueryBuilder('buyer')
      .leftJoinAndSelect('buyer.preferences', 'preferences')
      .leftJoinAndSelect('buyer.user', 'user')
      .leftJoin('buyer.offers', 'offers')
      .leftJoin('offers.inspectionRequest', 'inspection')
      .where('buyer.user_id = :userId', { userId })
      .select([
        'buyer',
        'preferences',
        'user',
        'COUNT(DISTINCT offers.id) as total_offers_count',
        'COUNT(DISTINCT CASE WHEN inspection.status = :inspectionCompleted THEN inspection.id END) as total_inspection_completed_count'
      ])
      .setParameter('inspectionCompleted', 'COMPLETED')
      .groupBy('buyer.id')
      .addGroupBy('preferences.id')
      .addGroupBy('user.id')
      .addGroupBy('user.email')
      .addGroupBy('user.phone')
      .addGroupBy('user.name')
      .addGroupBy('user.role')
      .addGroupBy('user.rating')
      .addGroupBy('user.total_completed_transactions')
      .addGroupBy('user.created_at')
      .addGroupBy('user.updated_at')
      .getRawAndEntities();

    if (!buyerWithCounts.entities[0]) {
      throw new NotFoundException(`Buyer not found for user ${userId}`);
    }

    const buyer = buyerWithCounts.entities[0];
    const raw = buyerWithCounts.raw[0];

    return {
      ...buyer,
      total_offers_count: parseInt(raw.total_offers_count) || 0,
      total_inspection_completed_count: parseInt(raw.total_inspection_completed_count) || 0
    };
  }
} 