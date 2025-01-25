import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { TransformedTransaction } from '../../transactions/services/transaction.service';
import { NearbyInspection } from '../dto/farmer-home.dto';

export class BuyerPreference {
  @ApiProperty()
  produce_name: string;

  @ApiProperty()
  min_price: number;

  @ApiProperty()
  max_price: number;

  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  last_price_updated: Date;
}

export class TopOffer {
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
  images: string[];

  @ApiProperty()
  farmer_id: string;

  @ApiProperty()
  farmer_name: string;

  @ApiProperty()
  farmer_avatar_url: string;
}

export class NearbyProduce {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  icon_url: string;
}

export class BuyerHomeResponse {
  @ApiProperty()
  is_online: boolean;

  @ApiProperty({ type: [BuyerPreference] })
  preferences: BuyerPreference[];

  @ApiProperty({ type: [TopOffer] })
  top_offers: TopOffer[];

  @ApiProperty({ type: [NearbyProduce] })
  nearby_produces: NearbyProduce[];

  @ApiProperty({
    type: 'array',
    description: 'List of high value transactions',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        offer_id: { type: 'string' },
        produce_id: { type: 'string' },
        buyer_id: { type: 'string' },
        farmer_id: { type: 'string' },
        final_price: { type: 'number' },
        final_quantity: { type: 'number' },
        status: { type: 'string' },
        delivery_window_starts_at: { type: 'string', format: 'date-time', nullable: true },
        delivery_window_ends_at: { type: 'string', format: 'date-time', nullable: true },
        delivery_confirmed_at: { type: 'string', format: 'date-time', nullable: true },
        buyer_inspection_completed_at: { type: 'string', format: 'date-time', nullable: true },
        distance_km: { type: 'number' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
        requires_rating: { type: 'boolean' },
        rating_completed: { type: 'boolean' },
        produce: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            quality_grade: { type: 'number' }
          }
        }
      }
    }
  })
  high_value_transactions: TransformedTransaction[];

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

export class GetBuyerHomeQueryDto {
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