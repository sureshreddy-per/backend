import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BuyerPreferences } from '../../buyers/entities/buyer-preferences.entity';
import { DailyPrice } from '../entities/daily-price.entity';
import { Buyer } from '../../buyers/entities/buyer.entity';
import { h3 } from 'h3-js';

interface LocationCluster {
  hexId: string;
  centerLat: number;
  centerLng: number;
  buyers: Array<{
    id: string;
    preferences: BuyerPreferences;
    location: [number, number];
  }>;
}

interface PriceAggregation {
  produce_name: string;
  min_price: number;
  max_price: number;
  average_price: number;
  buyer_count: number;
}

@Injectable()
export class DailyPriceCalculationService {
  private readonly logger = new Logger(DailyPriceCalculationService.name);
  private readonly H3_RESOLUTION = 4; // ~100km hexagons

  constructor(
    @InjectRepository(Buyer)
    private readonly buyerRepository: Repository<Buyer>,
    @InjectRepository(DailyPrice)
    private readonly dailyPriceRepository: Repository<DailyPrice>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async calculateDailyPrices() {
    this.logger.log('Starting daily price calculation based on location clusters');

    try {
      // 1. Get all active buyers with their preferences
      const buyers = await this.buyerRepository.find({
        where: { is_active: true },
        relations: ['preferences'],
      });

      // 2. Group buyers into hexagonal clusters
      const clusters = this.groupBuyersIntoClusters(buyers);

      // 3. Calculate prices for each cluster
      for (const cluster of clusters) {
        await this.calculatePricesForCluster(cluster);
      }

      this.logger.log('Daily price calculation completed successfully');
    } catch (error) {
      this.logger.error('Error in daily price calculation:', error.stack);
    }
  }

  private groupBuyersIntoClusters(buyers: Buyer[]): LocationCluster[] {
    const clusterMap = new Map<string, LocationCluster>();

    for (const buyer of buyers) {
      if (!buyer.location || !buyer.preferences?.produce_price_preferences?.length) {
        continue;
      }

      const [lat, lng] = buyer.location.split(',').map(Number);
      const hexId = h3.latLngToCell(lat, lng, this.H3_RESOLUTION);

      if (!clusterMap.has(hexId)) {
        const center = h3.cellToLatLng(hexId);
        clusterMap.set(hexId, {
          hexId,
          centerLat: center[0],
          centerLng: center[1],
          buyers: [],
        });
      }

      clusterMap.get(hexId).buyers.push({
        id: buyer.id,
        preferences: buyer.preferences,
        location: [lat, lng],
      });
    }

    return Array.from(clusterMap.values());
  }

  private async calculatePricesForCluster(cluster: LocationCluster) {
    const priceMap = new Map<string, PriceAggregation>();

    // Aggregate prices for each produce in the cluster
    for (const buyer of cluster.buyers) {
      for (const pref of buyer.preferences.produce_price_preferences) {
        if (!priceMap.has(pref.produce_name)) {
          priceMap.set(pref.produce_name, {
            produce_name: pref.produce_name,
            min_price: Infinity,
            max_price: -Infinity,
            average_price: 0,
            buyer_count: 0,
          });
        }

        const aggregation = priceMap.get(pref.produce_name);
        aggregation.min_price = Math.min(aggregation.min_price, pref.min_price);
        aggregation.max_price = Math.max(aggregation.max_price, pref.max_price);
        aggregation.average_price += (pref.min_price + pref.max_price) / 2;
        aggregation.buyer_count++;
      }
    }

    // Calculate final averages and save daily prices
    for (const [produceName, aggregation] of priceMap.entries()) {
      if (aggregation.buyer_count > 0) {
        aggregation.average_price /= aggregation.buyer_count;

        await this.dailyPriceRepository.save({
          produce_name: produceName,
          min_price: aggregation.min_price,
          max_price: aggregation.max_price,
          average_price: aggregation.average_price,
          market_name: `H3_${cluster.hexId}`,
          location: `${cluster.centerLat},${cluster.centerLng}`,
          metadata: {
            h3_index: cluster.hexId,
            buyer_count: aggregation.buyer_count,
            calculation_type: 'hexagonal_cluster',
            radius_km: 100,
            center_location: {
              lat: cluster.centerLat,
              lng: cluster.centerLng
            }
          }
        });

        this.logger.debug(
          `Calculated prices for ${produceName} in cluster ${cluster.hexId}:` +
          `min=${aggregation.min_price}, max=${aggregation.max_price}, ` +
          `avg=${aggregation.average_price}, buyers=${aggregation.buyer_count}`
        );
      }
    }
  }
} 