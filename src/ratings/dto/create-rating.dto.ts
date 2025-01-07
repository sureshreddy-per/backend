import { IsString, IsNumber, IsOptional, IsUUID, Min, Max, IsObject, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRatingDto {
  @ApiProperty({ description: 'ID of the offer being rated' })
  @IsUUID()
  offer_id: string;

  @ApiProperty({ description: 'Star rating (1-5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  stars: number;

  @ApiPropertyOptional({ description: 'Review text' })
  @IsOptional()
  @IsString()
  review_text?: string;

  @ApiPropertyOptional({
    description: 'Detailed category ratings',
    example: {
      communication: 4,
      reliability: 5,
      quality: 3,
    },
  })
  @IsOptional()
  @IsObject()
  categories?: {
    communication?: number;
    reliability?: number;
    quality?: number;
  };

  @ApiPropertyOptional({
    description: 'Tags for the review',
    example: ['prompt-payment', 'good-communication'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
} 