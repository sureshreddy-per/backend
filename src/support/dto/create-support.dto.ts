import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupportCategory, SupportPriority } from '../entities/support.entity';

export class CreateSupportDto {
  @ApiProperty({ description: 'Title of the support ticket' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Detailed description of the issue' })
  @IsString()
  description: string;

  @ApiProperty({
    enum: SupportCategory,
    description: 'Category of the support ticket',
  })
  @IsEnum(SupportCategory)
  category: SupportCategory;

  @ApiPropertyOptional({
    enum: SupportPriority,
    description: 'Priority level of the support ticket',
    default: SupportPriority.MEDIUM,
  })
  @IsEnum(SupportPriority)
  @IsOptional()
  priority?: SupportPriority;

  @ApiPropertyOptional({
    type: [String],
    description: 'Array of file paths for attachments',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];

  @ApiPropertyOptional({
    type: 'object',
    description: 'Additional metadata for the support ticket',
  })
  @IsOptional()
  metadata?: Record<string, any>;
} 