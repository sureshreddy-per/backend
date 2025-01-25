import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyPrice } from '../../offers/entities/daily-price.entity';
import { MarketTrend } from '../../home/dto/farmer-home.dto';

@Injectable()
export class MarketTrendService {
  private readonly logger = new Logger(MarketTrendService.name);

  constructor(
    @InjectRepository(DailyPrice)
    private readonly dailyPriceRepository: Repository<DailyPrice>,
  ) {}

  async getTrendsForFarmer(farmerId: string): Promise<MarketTrend[]> {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const result = await this.dailyPriceRepository
      .createQueryBuilder('dp')
      .select([
        'dp.produce_name',
        'dp.created_at::date as date',
        'AVG(dp.average_price) as avg_price',
        'MIN(dp.min_price) as min_price',
        'MAX(dp.max_price) as max_price'
      ])
      .where('dp.created_at >= :fiveDaysAgo', { fiveDaysAgo })
      .groupBy('dp.produce_name, dp.created_at::date')
      .orderBy('dp.produce_name', 'ASC')
      .addOrderBy('dp.created_at::date', 'DESC')
      .limit(25) // 5 produce * 5 days
      .getRawMany();

    // Transform raw data into MarketTrend[]
    const trendMap = new Map<string, MarketTrend>();
    
    result.forEach(row => {
      if (!trendMap.has(row.produce_name)) {
        trendMap.set(row.produce_name, {
          produce_name: row.produce_name,
          daily_prices: [],
          today: {
            min_price: null,
            max_price: null
          }
        });
      }

      const trend = trendMap.get(row.produce_name);
      const today = new Date().toISOString().split('T')[0];

      if (row.date === today) {
        trend.today.min_price = parseFloat(row.min_price);
        trend.today.max_price = parseFloat(row.max_price);
      }

      trend.daily_prices.push({
        date: row.date,
        timestamp: new Date(row.date).toISOString(),
        unix_timestamp: new Date(row.date).getTime(),
        avg_price: parseFloat(row.avg_price)
      });
    });

    // Get top 5 produce by trading volume
    return Array.from(trendMap.values())
      .filter(trend => trend.today.min_price !== null)
      .slice(0, 5);
  }
} 