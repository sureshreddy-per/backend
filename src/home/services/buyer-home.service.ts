import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Buyer } from '../../buyers/entities/buyer.entity';
import { BuyerPreferences } from '../../buyers/entities/buyer-preferences.entity';
import { Produce } from '../../produce/entities/produce.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { InspectionRequest } from '../../quality/entities/inspection-request.entity';
import { QualityAssessmentService } from '../../quality/services/quality-assessment.service';
import { BuyerHomeResponse, TopOffer, NearbyProduce, BuyerPreference } from '../dto/buyer-home.dto';
import { NearbyInspection } from '../dto/farmer-home.dto';
import { TransactionStatus } from '../../transactions/entities/transaction.entity';
import { TransformedTransaction } from '../../transactions/services/transaction.service';

@Injectable()
export class BuyerHomeService {
  private readonly logger = new Logger(BuyerHomeService.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'buyer_home:';

  constructor(
    @InjectRepository(Buyer)
    private readonly buyerRepository: Repository<Buyer>,
    @InjectRepository(BuyerPreferences)
    private readonly preferenceRepository: Repository<BuyerPreferences>,
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(InspectionRequest)
    private readonly inspectionRepository: Repository<InspectionRequest>,
    private readonly qualityAssessmentService: QualityAssessmentService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getBuyerHomeData(userId: string, location: string): Promise<BuyerHomeResponse> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${userId}:${location}`;
      const cachedData = await this.cacheManager.get<BuyerHomeResponse>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      const [lat, lng] = location.split(',').map(Number);

      // First get the buyer to get their ID
      const buyer = await this.getBuyerStatus(userId);

      const [
        preferences,
        topOffers,
        nearbyProduces,
        highValueTransactions,
        inspections
      ] = await Promise.all([
        this.getBuyerPreferences(buyer.id),
        this.getTopOffers(buyer.id, location),
        this.getNearbyProduces(location),
        this.getHighValueTransactions(buyer.id, location),
        this.getInspections(buyer.id, location)
      ]);

      const response = {
        is_online: buyer.is_active,
        preferences,
        top_offers: topOffers,
        nearby_produces: nearbyProduces,
        high_value_transactions: highValueTransactions,
        inspections
      };

      await this.cacheManager.set(cacheKey, response, this.CACHE_TTL);
      return response;

    } catch (error) {
      this.logger.error(`Error getting buyer home data: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async getBuyerStatus(userId: string): Promise<Buyer> {
    const cacheKey = `${this.CACHE_PREFIX}buyer:${userId}`;
    const cachedBuyer = await this.cacheManager.get<Buyer>(cacheKey);
    
    if (cachedBuyer) {
      return cachedBuyer;
    }

    const buyer = await this.buyerRepository.findOne({ 
      where: { user_id: userId },
      select: ['id', 'is_active']
    });

    if (!buyer) {
      throw new NotFoundException(`Buyer not found for user ${userId}`);
    }

    await this.cacheManager.set(cacheKey, buyer, this.CACHE_TTL);
    return buyer;
  }

  private async getBuyerPreferences(buyerId: string): Promise<BuyerPreference[]> {
    const cacheKey = `${this.CACHE_PREFIX}preferences:${buyerId}`;
    const cachedPreferences = await this.cacheManager.get<BuyerPreference[]>(cacheKey);
    
    if (cachedPreferences) {
      return cachedPreferences;
    }

    const preferences = await this.preferenceRepository
      .createQueryBuilder('bp')
      .select([
        'bp.produce_price_preferences',
        'bp.last_price_updated'
      ])
      .where('bp.buyer_id = :buyerId', { buyerId })
      .orderBy('bp.created_at', 'DESC')
      .getRawMany();

    const transformedPreferences = preferences.flatMap(p => {
      if (!p.bp_produce_price_preferences) return [];
      return p.bp_produce_price_preferences.map(pref => ({
        produce_name: pref.produce_name,
        min_price: pref.min_price,
        max_price: pref.max_price,
        last_price_updated: p.bp_last_price_updated
      }));
    });

    await this.cacheManager.set(cacheKey, transformedPreferences, this.CACHE_TTL);
    return transformedPreferences;
  }

  private async getTopOffers(buyerId: string, location: string): Promise<TopOffer[]> {
    const cacheKey = `${this.CACHE_PREFIX}top_offers:${buyerId}:${location}`;
    const cachedOffers = await this.cacheManager.get<TopOffer[]>(cacheKey);
    
    if (cachedOffers) {
      return cachedOffers;
    }

    const [lat, lng] = location.split(',').map(Number);
    
    const offers = await this.produceRepository
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.farmer', 'f')
      .innerJoinAndSelect('f.user', 'u')
      .where('p.status = :status', { status: 'ACTIVE' })
      .andWhere(
        `ST_DWithin(
          ST_SetSRID(ST_MakePoint(CAST(split_part(p.location, ',', 2) AS FLOAT), 
                                 CAST(split_part(p.location, ',', 1) AS FLOAT)), 4326),
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
          100000
        )`,
        { lat, lng }
      )
      .select([
        'p.id as produce_id',
        'p.name',
        'p.quantity',
        'p.unit',
        'p.quality_grade',
        `ST_Distance(
          ST_SetSRID(ST_MakePoint(CAST(split_part(p.location, ',', 2) AS FLOAT), 
                                 CAST(split_part(p.location, ',', 1) AS FLOAT)), 4326),
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
        ) / 1000 as distance_km`,
        'p.is_inspection_requested as is_manually_inspected',
        'p.images',
        'f.id as farmer_id',
        'u.name as farmer_name',
        'u.avatar_url as farmer_avatar_url'
      ])
      .orderBy('p.created_at', 'DESC')
      .limit(7)
      .cache(this.CACHE_TTL)
      .getRawMany();

    await this.cacheManager.set(cacheKey, offers, this.CACHE_TTL);
    return offers;
  }

  private async getNearbyProduces(location: string): Promise<NearbyProduce[]> {
    const cacheKey = `${this.CACHE_PREFIX}nearby_produces:${location}`;
    const cachedProduces = await this.cacheManager.get<NearbyProduce[]>(cacheKey);
    
    if (cachedProduces) {
      return cachedProduces;
    }

    const [lat, lng] = location.split(',').map(Number);

    const produces = await this.produceRepository
      .createQueryBuilder('p')
      .select('DISTINCT ON (p.name) p.name')
      .addSelect([
        'p.id',
        'p.icon_url'
      ])
      .where('p.status = :status', { status: 'ACTIVE' })
      .andWhere(
        `ST_DWithin(
          ST_SetSRID(ST_MakePoint(CAST(split_part(p.location, ',', 2) AS FLOAT), 
                                 CAST(split_part(p.location, ',', 1) AS FLOAT)), 4326),
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
          100000
        )`,
        { lat, lng }
      )
      .orderBy('p.name', 'ASC')
      .limit(15)
      .getRawMany();

    await this.cacheManager.set(cacheKey, produces, this.CACHE_TTL);
    return produces;
  }

  private async getHighValueTransactions(buyerId: string, location: string): Promise<TransformedTransaction[]> {
    const cacheKey = `${this.CACHE_PREFIX}transactions:${buyerId}:${location}`;
    const cachedTransactions = await this.cacheManager.get<TransformedTransaction[]>(cacheKey);
    
    if (cachedTransactions) {
      return cachedTransactions;
    }

    const [lat, lng] = location.split(',').map(Number);
    
    // First try to get IN_PROGRESS transactions
    let transactions = await this.transactionRepository
      .createQueryBuilder('t')
      .innerJoinAndSelect('t.produce', 'p')
      .where('t.buyer_id = :buyerId', { buyerId })
      .andWhere('t.status = :status', { status: TransactionStatus.IN_PROGRESS })
      .orderBy('t.final_price * t.final_quantity', 'DESC') // Optimize sorting by total amount
      .limit(7)
      .cache(this.CACHE_TTL)
      .getMany();

    // If no IN_PROGRESS transactions, get COMPLETED ones
    if (transactions.length === 0) {
      transactions = await this.transactionRepository
        .createQueryBuilder('t')
        .innerJoinAndSelect('t.produce', 'p')
        .where('t.buyer_id = :buyerId', { buyerId })
        .andWhere('t.status = :status', { status: TransactionStatus.COMPLETED })
        .orderBy('t.final_price * t.final_quantity', 'DESC') // Optimize sorting by total amount
        .limit(7)
        .cache(this.CACHE_TTL)
        .getMany();
    }

    const transformedTransactions = transactions.map(t => {
      const [produceLat, produceLng] = t.produce.location.split(',').map(Number);
      return {
        ...t,
        distance_km: this.calculateDistance(lat, lng, produceLat, produceLng)
      };
    });

    await this.cacheManager.set(cacheKey, transformedTransactions, this.CACHE_TTL);
    return transformedTransactions;
  }

  private async getInspections(buyerId: string, location: string): Promise<{
    recent: NearbyInspection[];
    nearby: NearbyInspection[];
  }> {
    const cacheKey = `${this.CACHE_PREFIX}inspections:${buyerId}:${location}`;
    const cachedInspections = await this.cacheManager.get<{
      recent: NearbyInspection[];
      nearby: NearbyInspection[];
    }>(cacheKey);
    
    if (cachedInspections) {
      return cachedInspections;
    }

    const [lat, lng] = location.split(',').map(Number);

    // Get recent inspections
    const recentInspections = await this.inspectionRepository
      .createQueryBuilder('i')
      .innerJoinAndSelect('i.produce', 'p')
      .where('i.requester_id = :buyerId', { buyerId })
      .orderBy('i.created_at', 'DESC')
      .limit(7)
      .cache(this.CACHE_TTL)
      .getMany();

    // If no recent inspections, get nearby ones
    let nearbyInspections = [];
    if (recentInspections.length === 0) {
      nearbyInspections = await this.inspectionRepository
        .createQueryBuilder('i')
        .innerJoinAndSelect('i.produce', 'p')
        .where('i.requester_id != :buyerId', { buyerId })
        .andWhere(
          `ST_DWithin(
            ST_SetSRID(ST_MakePoint(CAST(split_part(i.location, ',', 2) AS FLOAT), 
                                   CAST(split_part(i.location, ',', 1) AS FLOAT)), 4326),
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
            100000
          )`,
          { lat, lng }
        )
        .orderBy('i.created_at', 'DESC')
        .limit(7)
        .cache(this.CACHE_TTL)
        .getMany();
    }

    const result = {
      recent: await this.transformInspections(recentInspections),
      nearby: await this.transformInspections(nearbyInspections)
    };

    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  private async transformInspections(inspections: InspectionRequest[]): Promise<NearbyInspection[]> {
    return Promise.all(
      inspections.map(async i => {
        const cacheKey = `${this.CACHE_PREFIX}quality_assessment:${i.produce.id}`;
        let assessment = await this.cacheManager.get(cacheKey);
        
        if (!assessment) {
          assessment = await this.qualityAssessmentService.findLatestByProduceId(i.produce.id);
          await this.cacheManager.set(cacheKey, assessment, this.CACHE_TTL);
        }

        return {
          inspection_id: i.id,
          produce_id: i.produce.id,
          produce_name: i.produce.name,
          produce_images: i.produce.images,
          quality_assessment: assessment
        };
      })
    );
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
} 