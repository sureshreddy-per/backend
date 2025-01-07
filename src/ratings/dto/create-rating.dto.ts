import { IsUUID, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRatingDto {
  @ApiProperty()
  @IsUUID()
  rated_user_id: string;

  @ApiProperty()
  @IsUUID()
  rating_user_id: string;

  @ApiProperty()
  @IsUUID()
  transaction_id: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(5)
  stars: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;
} 