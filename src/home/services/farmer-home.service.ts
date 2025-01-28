import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Farmer } from '../../farmers/entities/farmer.entity';
import { Produce } from '../../produce/entities/produce.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { InspectionRequest } from '../../quality/entities/inspection-request.entity';
import { QualityAssessmentService } from '../../quality/services/quality-assessment.service';
import { MarketTrendService } from '../../market/services/market-trend.service';
import { FarmerHomeResponse, MarketTrend, NearbyOffer, RecentProduce, TopBuyer, NearbyInspection } from '../dto/farmer-home.dto';
import { ProduceStatus } from '../../produce/enums/produce-status.enum';
import { TransactionStatus } from '../../transactions/entities/transaction.entity';

@Injectable()
export class FarmerHomeService {
  private readonly logger = new Logger(FarmerHomeService.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'farmer_home:';

  constructor(
    @InjectRepository(Farmer)
    private readonly farmerRepository: Repository<Farmer>,
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(InspectionRequest)
    private readonly inspectionRepository: Repository<InspectionRequest>,
    private readonly qualityAssessmentService: QualityAssessmentService,
    private readonly marketTrendService: MarketTrendService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getFarmerHomeData(userId: string, location: string): Promise<FarmerHomeResponse> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${userId}:${location}`;
      this.logger.debug(`Getting farmer home data for user ${userId} at location ${location}`);
      
      const cachedData = await this.cacheManager.get<FarmerHomeResponse>(cacheKey);
      
      if (cachedData) {
        this.logger.debug('Returning cached data');
        return cachedData;
      }

      // First get the farmer ID from user ID
      const farmer = await this.farmerRepository.findOne({
        where: { user_id: userId }
      });

      if (!farmer) {
        this.logger.error(`No farmer found for user ${userId}`);
        return {
          market_trends: [],
          active_offers: { my_offers: [], nearby_offers: [] },
          recent_produces: [],
          top_buyers: [],
          inspections: { recent: [], nearby: [] }
        };
      }

      this.logger.debug(`Found farmer ${farmer.id} for user ${userId}`);

      const [lat, lng] = location.split(',').map(Number);

      this.logger.debug(`Fetching all data components in parallel for farmer ${farmer.id}`);
      const [
        marketTrends,
        activeOffers,
        recentProduces,
        topBuyers,
        inspections
      ] = await Promise.all([
        this.getMarketTrends(farmer.id),
        this.getActiveOffers(farmer.id, location),
        this.getRecentProduces(farmer.id, location),
        this.getTopBuyers(farmer.id),
        this.getInspections(farmer.id, location)
      ]);

      this.logger.debug(`Data fetched for farmer ${farmer.id}:
        Market Trends: ${marketTrends?.length ?? 0} items
        Active Offers: ${activeOffers?.my_offers?.length ?? 0} my offers, ${activeOffers?.nearby_offers?.length ?? 0} nearby
        Recent Produces: ${recentProduces?.length ?? 0} items
        Top Buyers: ${topBuyers?.length ?? 0} items
        Inspections: ${inspections?.recent?.length ?? 0} recent, ${inspections?.nearby?.length ?? 0} nearby
      `);

      const response = {
        market_trends: marketTrends,
        active_offers: activeOffers,
        recent_produces: recentProduces,
        top_buyers: topBuyers,
        inspections
      };

      await this.cacheManager.set(cacheKey, response, this.CACHE_TTL);
      return response;

    } catch (error) {
      this.logger.error(`Error getting farmer home data: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async getMarketTrends(farmerId: string): Promise<MarketTrend[]> {
    const cacheKey = `${this.CACHE_PREFIX}market_trends:${farmerId}`;
    const cachedTrends = await this.cacheManager.get<MarketTrend[]>(cacheKey);
    
    if (cachedTrends) {
      return cachedTrends;
    }

    const trends = await this.marketTrendService.getTrendsForFarmer(farmerId);
    await this.cacheManager.set(cacheKey, trends, this.CACHE_TTL);
    return trends;
  }

  private async getActiveOffers(farmerId: string, location: string): Promise<{
    my_offers: NearbyOffer[];
    nearby_offers: NearbyOffer[];
  }> {
    const cacheKey = `${this.CACHE_PREFIX}active_offers:${farmerId}:${location}`;
    const cachedOffers = await this.cacheManager.get<{
      my_offers: NearbyOffer[];
      nearby_offers: NearbyOffer[];
    }>(cacheKey);
    
    if (cachedOffers) {
      return cachedOffers;
    }

    const [lat, lng] = location.split(',').map(Number);

    const activeStatuses = [
      ProduceStatus.AVAILABLE,
      ProduceStatus.ASSESSED,
      ProduceStatus.PENDING_INSPECTION,
      ProduceStatus.FINAL_PRICE,
      ProduceStatus.IN_PROGRESS
    ];

    // Get my active offers
    const myOffers = await this.produceRepository
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.farmer', 'f')
      .innerJoinAndSelect('f.user', 'u')
      .where('p.farmer_id = :farmerId', { farmerId })
      .andWhere('p.status IN (:...statuses)', { statuses: activeStatuses })
      .select([
        'p.id as produce_id',
        'p.name',
        'p.quantity',
        'p.unit',
        'p.quality_grade',
        'p.status',
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

    // Get nearby offers
    const nearbyOffers = await this.produceRepository
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.farmer', 'f')
      .innerJoinAndSelect('f.user', 'u')
      .where('p.farmer_id != :farmerId', { farmerId })
      .andWhere('p.status IN (:...statuses)', { statuses: activeStatuses })
      .andWhere(
        `ST_DWithin(
          ST_SetSRID(ST_MakePoint(CAST(split_part(p.location, ',', 2) AS FLOAT), 
                                 CAST(split_part(p.location, ',', 1) AS FLOAT)), 4326),
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
          100000
        )`,
        { lng, lat }
      )
      .select([
        'p.id as produce_id',
        'p.name',
        'p.quantity',
        'p.unit',
        'p.quality_grade',
        'p.status',
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

    const result = {
      my_offers: myOffers,
      nearby_offers: nearbyOffers
    };

    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  private async getRecentProduces(farmerId: string, location: string): Promise<RecentProduce[]> {
    const cacheKey = `${this.CACHE_PREFIX}recent_produces:${farmerId}:${location}`;
    
    this.logger.debug(`Getting recent produces for farmer ${farmerId} at location ${location}`);

    const [lat, lng] = location.split(',').map(Number);

    const excludedStatuses = [
      ProduceStatus.CANCELLED,
      ProduceStatus.SOLD,
      ProduceStatus.COMPLETED,
      ProduceStatus.REJECTED,
      ProduceStatus.PENDING_AI_ASSESSMENT,
      ProduceStatus.ASSESSMENT_FAILED
    ];

    const queryBuilder = this.produceRepository
      .createQueryBuilder('p')
      .where('p.farmer_id = :farmerId', { farmerId })
      .andWhere('p.status NOT IN (:...excludedStatuses)', { excludedStatuses })
      .select([
        'p.id as produce_id',
        'p.name',
        'p.quantity',
        'p.unit',
        'p.quality_grade',
        'p.status',
        'p.is_inspection_requested as is_manually_inspected',
        'p.images as produce_images',
        `ST_Distance(
          ST_SetSRID(ST_MakePoint(CAST(split_part(p.location, ',', 2) AS FLOAT), 
                                 CAST(split_part(p.location, ',', 1) AS FLOAT)), 4326),
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
        ) / 1000 as distance_km`
      ])
      .setParameters({ farmerId, lng, lat })
      .orderBy('p.created_at', 'DESC')
      .limit(7);

    // Log the generated SQL
    const sql = queryBuilder.getSql();
    const params = queryBuilder.getParameters();
    this.logger.debug('Recent produces SQL:', sql);
    this.logger.debug('Recent produces parameters:', params);

    const produces = await queryBuilder.getRawMany();
    this.logger.debug(`Found ${produces.length} recent produces with statuses: ${produces.map(p => p.status).join(', ')}`);
    
    if (produces.length === 0) {
      // Log a sample direct query to check if data exists
      const checkData = await this.produceRepository
        .createQueryBuilder('p')
        .where('p.farmer_id = :farmerId', { farmerId })
        .select(['p.id', 'p.name', 'p.status'])
        .getRawMany();
      this.logger.debug('Direct query check results:', checkData);
    }

    // Transform the results to ensure correct format
    const transformedProduces = produces.map(p => ({
      produce_id: p.produce_id,
      name: p.name,
      quantity: parseFloat(p.quantity),
      unit: p.unit,
      quality_grade: parseFloat(p.quality_grade),
      distance_km: parseFloat(p.distance_km),
      is_manually_inspected: p.is_manually_inspected,
      produce_images: Array.isArray(p.produce_images) ? p.produce_images : [],
      status: p.status
    }));

    this.logger.debug('Transformed produces:', transformedProduces);

    await this.cacheManager.set(cacheKey, transformedProduces, this.CACHE_TTL);
    return transformedProduces;
  }

  private async getTopBuyers(farmerId: string): Promise<TopBuyer[]> {
    const cacheKey = `${this.CACHE_PREFIX}top_buyers:${farmerId}`;
    const cachedBuyers = await this.cacheManager.get<TopBuyer[]>(cacheKey);
    
    if (cachedBuyers) {
      return cachedBuyers;
    }

    const buyers = await this.transactionRepository
      .createQueryBuilder('t')
      .innerJoin('buyers', 'b', 'b.id = t.buyer_id')
      .innerJoin('users', 'u', 'u.id = b.user_id')
      .where('t.farmer_id = :farmerId', { farmerId })
      .andWhere('t.status = :status', { status: TransactionStatus.COMPLETED })
      .select([
        'b.id',
        'b.business_name',
        'u.name',
        'u.avatar_url',
        'AVG(CAST(t.metadata->>\'buyer_rating\' AS NUMERIC))::float as rating',
        'COUNT(t.id) as total_completed_transactions'
      ])
      .groupBy('b.id, b.business_name, u.name, u.avatar_url')
      .orderBy('total_completed_transactions', 'DESC')
      .limit(7)
      .cache(this.CACHE_TTL)
      .getRawMany();

    await this.cacheManager.set(cacheKey, buyers, this.CACHE_TTL);
    return buyers;
  }

  private async getInspections(farmerId: string, location: string): Promise<{
    recent: NearbyInspection[];
    nearby: NearbyInspection[];
  }> {
    const cacheKey = `${this.CACHE_PREFIX}inspections:${farmerId}:${location}`;
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
      .where('p.farmer_id = :farmerId', { farmerId })
      .orderBy('i.created_at', 'DESC')
      .limit(7)
      .cache(this.CACHE_TTL)
      .getMany();

    // Get nearby inspections
    const nearbyInspections = await this.inspectionRepository
      .createQueryBuilder('i')
      .innerJoinAndSelect('i.produce', 'p')
      .where('p.farmer_id != :farmerId', { farmerId })
      .andWhere(
        `ST_DWithin(
          ST_SetSRID(ST_MakePoint(CAST(split_part(i.location, ',', 2) AS FLOAT), 
                                 CAST(split_part(i.location, ',', 1) AS FLOAT)), 4326),
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
          100000
        )`,
        { lng, lat }
      )
      .orderBy('i.created_at', 'DESC')
      .limit(7)
      .cache(this.CACHE_TTL)
      .getMany();

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