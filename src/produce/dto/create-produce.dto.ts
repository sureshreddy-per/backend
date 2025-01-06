import { IsString, IsNumber, IsOptional, IsEnum, ValidateNested, Min, IsObject, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProduceCategory } from '../entities/produce.entity';
import { FoodGrains } from '../entities/produce-categories/food-grains.entity';
import { Oilseeds } from '../entities/produce-categories/oilseeds.entity';
import { Fruits } from '../entities/produce-categories/fruits.entity';
import { Vegetables } from '../entities/produce-categories/vegetables.entity';
import { Spices } from '../entities/produce-categories/spices.entity';
import { Fibers } from '../entities/produce-categories/fibers.entity';
import { Sugarcane } from '../entities/produce-categories/sugarcane.entity';
import { Flowers } from '../entities/produce-categories/flowers.entity';
import { MedicinalPlants } from '../entities/produce-categories/medicinal-plants.entity';

export class LocationDto {
  @ApiProperty({ description: 'Latitude of the produce location' })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitude of the produce location' })
  @IsNumber()
  longitude: number;
}

export class CreateProduceDto {
  @ApiProperty({ description: 'ID of the farm where this produce was grown', required: false })
  @IsString()
  @IsOptional()
  farmId?: string;

  @ApiProperty({ description: 'Category of the produce', enum: ProduceCategory })
  @IsEnum(ProduceCategory)
  category: ProduceCategory;

  @ApiProperty({ description: 'Name of the produce' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description of the produce' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Quantity of the produce' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Unit of measurement for the quantity' })
  @IsString()
  unit: string;

  @ApiProperty({ description: 'Price per unit of the produce', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ description: 'Price per unit of the produce' })
  @IsNumber()
  @Min(0)
  pricePerUnit: number;

  @ApiProperty({ description: 'Currency of the price', required: false, default: 'INR' })
  @IsOptional()
  @IsString()
  currency: string = 'INR';

  @ApiProperty({ description: 'Location coordinates of the produce' })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({ description: 'Food grain specific details', required: false, type: () => FoodGrains })
  @IsOptional()
  @IsObject()
  foodGrains?: any;

  @ApiProperty({ description: 'Oilseed specific details', required: false, type: () => Oilseeds })
  @IsOptional()
  @IsObject()
  oilseeds?: any;

  @ApiProperty({ description: 'Fruit specific details', required: false, type: () => Fruits })
  @IsOptional()
  @IsObject()
  fruits?: any;

  @ApiProperty({ description: 'Vegetable specific details', required: false, type: () => Vegetables })
  @IsOptional()
  @IsObject()
  vegetables?: any;

  @ApiProperty({ description: 'Spice specific details', required: false, type: () => Spices })
  @IsOptional()
  @IsObject()
  spices?: any;

  @ApiProperty({ description: 'Fiber specific details', required: false, type: () => Fibers })
  @IsOptional()
  @IsObject()
  fibers?: any;

  @ApiProperty({ description: 'Sugarcane specific details', required: false, type: () => Sugarcane })
  @IsOptional()
  @IsObject()
  sugarcane?: any;

  @ApiProperty({ description: 'Flower specific details', required: false, type: () => Flowers })
  @IsOptional()
  @IsObject()
  flowers?: any;

  @ApiProperty({ description: 'Medicinal plant specific details', required: false, type: () => MedicinalPlants })
  @IsOptional()
  @IsObject()
  medicinalPlants?: any;

  @ApiProperty({ type: [String], description: 'Array of image URLs' })
  @IsArray()
  @IsString({ each: true })
  imageUrls: string[];

  @ApiProperty({ description: 'Primary image URL from imageUrls array', required: false })
  @IsString()
  @IsOptional()
  primaryImageUrl?: string;

  @ApiProperty({ description: 'URL of the video file', required: false })
  @IsString()
  @IsOptional()
  videoUrl?: string;
} 