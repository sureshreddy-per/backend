import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../enums/notification-type.enum';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Title of the notification' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Message content of the notification' })
  @IsString()
  message: string;

  @ApiProperty({
    enum: NotificationType,
    description: 'Type of the notification',
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiPropertyOptional({
    description: 'ID of the customer to send notification to',
  })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'ID of the buyer to send notification to',
  })
  @IsUUID()
  @IsOptional()
  buyerId?: string;

  @ApiPropertyOptional({
    type: 'object',
    description: 'Additional metadata for the notification',
  })
  @IsOptional()
  metadata?: Record<string, any>;
} 