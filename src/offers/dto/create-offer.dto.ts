import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from "class-validator";

export class CreateOfferDto {
  @IsUUID()
  @IsNotEmpty()
  buyer_id: string;

  @IsUUID()
  @IsNotEmpty()
  farmer_id: string;

  @IsUUID()
  @IsNotEmpty()
  produce_id: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  quantity: number;

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
