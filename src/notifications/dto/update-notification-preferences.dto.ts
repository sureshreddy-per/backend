import { IsBoolean, IsArray, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../enums/notification-type.enum';

export class UpdateNotificationPreferencesDto {
  @ApiProperty({ description: 'Enable/disable email notifications' })
  @IsBoolean()
  @IsOptional()
  email_enabled?: boolean;

  @ApiProperty({ description: 'Enable/disable SMS notifications' })
  @IsBoolean()
  @IsOptional()
  sms_enabled?: boolean;

  @ApiProperty({ description: 'Enable/disable push notifications' })
  @IsBoolean()
  @IsOptional()
  push_enabled?: boolean;

  @ApiProperty({ description: 'Types of notifications to receive', enum: NotificationType, isArray: true })
  @IsArray()
  @IsEnum(NotificationType, { each: true })
  @IsOptional()
  notification_types?: NotificationType[];
} 