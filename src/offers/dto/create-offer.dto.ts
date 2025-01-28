import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min, Max } from "class-validator";

export class CreateOfferDto {
  @IsUUID()
  @IsOptional()
  buyer_id?: string;

  @IsUUID()
  @IsNotEmpty()
  farmer_id: string;

  @IsUUID()
  @IsNotEmpty()
  produce_id: string;

  @IsNumber()
  @Min(0)
  price_per_unit: number;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  buyer_min_price: number;

  @IsNumber()
  @Min(0)
  buyer_max_price: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  quality_grade: number;

  @IsNumber()
  @Min(0)
  distance_km: number;

  @IsNumber()
  @Min(0)
  inspection_fee: number;

  @IsOptional()
  message?: string;

  @IsOptional()
  valid_until?: Date;

  @IsOptional()
  metadata?: {
    daily_price_id?: string;
    inspection_result?: any;
    [key: string]: any;
  };
}
