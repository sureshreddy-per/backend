import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsOptional,
  IsLatLong,
  MaxLength,
  IsDate,
  IsEnum,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  Matches,
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

  @ApiProperty({ description: "Location in 'latitude,longitude' format (e.g., '12.9716,77.5946')" })
  @IsLatLong()
  @Matches(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, {
    message: "Location must be in format: latitude,longitude (e.g., 12.9716,77.5946)",
  })
  location: string;

  @ApiPropertyOptional({ description: "Optional location name" })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  location_name?: string;

  @ApiPropertyOptional({ description: "Optional harvest date" })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  harvested_at?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ description: "Array of image URLs" })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  images: string[];

  @ApiPropertyOptional({ description: "Optional video URL" })
  @IsString()
  @IsOptional()
  video_url?: string;
}
