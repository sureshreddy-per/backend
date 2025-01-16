import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProducePricePreferenceDto } from './produce-price-preference.dto';

export class UpdateBuyerPreferencesDto {
  @ApiPropertyOptional({ description: 'List of produce names the buyer is interested in' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  produce_names?: string[];

  @ApiPropertyOptional({ description: 'List of produce-specific price preferences' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProducePricePreferenceDto)
  @IsOptional()
  produce_price_preferences?: ProducePricePreferenceDto[];

  @ApiPropertyOptional({ description: 'Whether notifications are enabled' })
  @IsBoolean()
  @IsOptional()
  notification_enabled?: boolean;

  @ApiPropertyOptional({ description: 'List of notification methods (e.g. EMAIL, SMS)' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  notification_methods?: string[];
} 