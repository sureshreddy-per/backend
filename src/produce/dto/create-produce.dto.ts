import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsLatLong,
  IsUrl,
  ArrayMaxSize,
  ArrayMinSize,
  MaxLength,
  IsDate,
  ValidateIf,
  IsEnum,
  IsDecimal,
} from "class-validator";
import { Type } from "class-transformer";
import { ProduceCategory } from "../enums/produce-category.enum";

export class CreateProduceDto {
  @ApiPropertyOptional({ description: "ID of the farmer who owns this produce" })
  @IsString()
  @IsOptional()
  farmer_id?: string;

  @ApiPropertyOptional({ description: "ID of the farm where produce was grown" })
  @IsString()
  @IsOptional()
  farm_id?: string;

  @ApiPropertyOptional({ description: "Name of the produce" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: "Description of the produce" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: "Variety of the produce" })
  @IsString()
  @IsOptional()
  product_variety?: string;

  @ApiPropertyOptional({ description: "Category of the produce" })
  @IsEnum(ProduceCategory)
  @IsOptional()
  produce_category?: ProduceCategory;

  @ApiProperty({ description: "Quantity of produce" })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: "Unit of measurement (e.g., kg, tons)" })
  @IsString()
  unit: string;

  @ApiPropertyOptional({ description: "Price per unit" })
  @IsNumber()
  @IsOptional()
  price_per_unit?: number;

  @ApiProperty({ description: "Location in 'latitude,longitude' format" })
  @IsLatLong()
  location: string;

  @ApiPropertyOptional({ description: "Optional location name" })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  location_name?: string;

  @ApiProperty({ description: "Array of image URLs (1-3 images required)" })
  @IsArray()
  @IsUrl({}, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  images: string[];

  @ApiPropertyOptional({ description: "Optional video URL (≤ 50 MB)" })
  @IsUrl()
  @IsOptional()
  video_url?: string;

  @ApiPropertyOptional({ description: "Optional harvest date" })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  harvested_at?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  language?: string;
}
