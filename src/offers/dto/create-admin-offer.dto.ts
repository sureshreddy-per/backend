import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min, Max } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateAdminOfferDto {
  @ApiProperty({ description: "Buyer's ID" })
  @IsUUID()
  @IsNotEmpty()
  buyer_id: string;

  @ApiProperty({ description: "Farmer's ID" })
  @IsUUID()
  @IsNotEmpty()
  farmer_id: string;

  @ApiProperty({ description: "Produce ID" })
  @IsUUID()
  @IsNotEmpty()
  produce_id: string;

  @ApiProperty({ description: "Price per unit" })
  @IsNumber()
  @Min(0)
  price_per_unit: number;

  @ApiProperty({ description: "Quantity" })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: "Minimum price set by buyer" })
  @IsNumber()
  @Min(0)
  buyer_min_price: number;

  @ApiProperty({ description: "Maximum price set by buyer" })
  @IsNumber()
  @Min(0)
  buyer_max_price: number;

  @ApiProperty({ description: "Quality grade of the produce" })
  @IsNumber()
  @Min(0)
  @Max(10)
  quality_grade: number;

  @ApiProperty({ description: "Distance in kilometers" })
  @IsNumber()
  @Min(0)
  distance_km: number;

  @ApiProperty({ description: "Inspection fee" })
  @IsNumber()
  @Min(0)
  inspection_fee: number;

  @ApiProperty({ description: "Optional message", required: false })
  @IsOptional()
  message?: string;

  @ApiProperty({ description: "Valid until date", required: false })
  @IsOptional()
  valid_until?: Date;

  @ApiProperty({ description: "Additional metadata", required: false })
  @IsOptional()
  metadata?: {
    daily_price_id?: string;
    inspection_result?: any;
    [key: string]: any;
  };
} 