import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBuyerPreferencesDto {
  @ApiPropertyOptional({ description: 'List of produce names the buyer is interested in' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  produce_names?: string[];

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