import { IsString, IsEnum, IsOptional, IsObject, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketCategory, TicketPriority } from '../entities/ticket.entity';

export class CreateTicketDto {
  @ApiProperty({ description: 'Title of the ticket' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Detailed description of the issue' })
  @IsString()
  description: string;

  @ApiProperty({ enum: TicketCategory, description: 'Category of the ticket' })
  @IsEnum(TicketCategory)
  category: TicketCategory;

  @ApiPropertyOptional({ enum: TicketPriority, description: 'Priority of the ticket' })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: {
      offerId: 'uuid',
      produceId: 'uuid',
      deviceInfo: {
        browser: 'Chrome',
        os: 'Windows',
        device: 'Desktop',
      },
      attachments: ['url1', 'url2'],
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: {
    offerId?: string;
    produceId?: string;
    ratingId?: string;
    deviceInfo?: {
      browser?: string;
      os?: string;
      device?: string;
    };
    attachments?: string[];
  };
} 