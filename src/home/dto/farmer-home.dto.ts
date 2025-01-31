import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class DailyPrice {
  @ApiProperty()
  date: string;

  @ApiProperty({ description: 'ISO timestamp for the day' })
  timestamp: string;

  @ApiProperty({ description: 'Unix timestamp in milliseconds for the day' })
  unix_timestamp: number;

  @ApiProperty()
  avg_price: number;
}

export class MarketTrend {
  @ApiProperty()
  produce_name: string;

  @ApiProperty({ type: [DailyPrice] })
  daily_prices: DailyPrice[];

  @ApiProperty()
  today: {
    min_price: number;
    max_price: number;
  };
}

export class BuyerInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  avatar_url: string;
}

export class NearbyOffer {
  @ApiProperty()
  produce_id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unit: string;

  @ApiProperty()
  quality_grade: number;

  @ApiProperty()
  distance_km: number;

  @ApiProperty()
  is_manually_inspected: boolean;

  @ApiProperty({ type: [String] })
  produce_images: string[];

  @ApiProperty({ type: BuyerInfo })
  buyer: BuyerInfo;

  @ApiProperty()
  offer_price: number;

  @ApiProperty()
  offer_status: string;
}

export class RecentProduce {
  @ApiProperty()
  produce_id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unit: string;

  @ApiProperty()
  quality_grade: number;

  @ApiProperty()
  distance_km: number;

  @ApiProperty()
  is_manually_inspected: boolean;

  @ApiProperty({ type: [String] })
  produce_images: string[];
}

export class TopBuyer {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  business_name: string;

  @ApiProperty()
  avatar_url: string;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  total_completed_transactions: number;
}

export class NearbyInspection {
  @ApiProperty()
  inspection_id: string;

  @ApiProperty()
  produce_id: string;

  @ApiProperty()
  produce_name: string;

  @ApiProperty({ type: [String] })
  produce_images: string[];

  @ApiProperty()
  quality_assessment: any; // Will be typed based on category-specific fields
}

export class FarmerHomeResponse {
  @ApiProperty({ type: [MarketTrend] })
  market_trends: MarketTrend[];

  @ApiProperty({
    type: 'object',
    properties: {
      my_offers: { type: 'array', items: { $ref: '#/components/schemas/NearbyOffer' } },
      nearby_offers: { type: 'array', items: { $ref: '#/components/schemas/NearbyOffer' } }
    }
  })
  active_offers: {
    my_offers: NearbyOffer[];
    nearby_offers: NearbyOffer[];
  };

  @ApiProperty({ type: [RecentProduce] })
  recent_produces: RecentProduce[];

  @ApiProperty({ type: [TopBuyer] })
  top_buyers: TopBuyer[];

  @ApiProperty({
    type: 'object',
    properties: {
      recent: { type: 'array', items: { $ref: '#/components/schemas/NearbyInspection' } },
      nearby: { type: 'array', items: { $ref: '#/components/schemas/NearbyInspection' } }
    }
  })
  inspections: {
    recent: NearbyInspection[];
    nearby: NearbyInspection[];
  };
}

export class GetFarmerHomeQueryDto {
  @ApiProperty({
    description: 'Location in format "latitude,longitude" (e.g. "12.34,56.78")',
    example: '12.34,56.78'
  })
  @IsString()
  @Matches(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, {
    message: 'Location must be in format "latitude,longitude" (e.g. "12.34,56.78")'
  })
  location: string;
}