import { IsString, IsNumber, IsOptional, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateOfferDto {
  @ApiProperty()
  @IsString()
  buyer_id: string;

  @ApiProperty()
  @IsString()
  produce_id: string;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  valid_until: Date;
} 