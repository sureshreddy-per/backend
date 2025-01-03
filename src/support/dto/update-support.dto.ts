import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateSupportDto } from './create-support.dto';
import { SupportStatus } from '../entities/support.entity';

export class UpdateSupportDto extends PartialType(CreateSupportDto) {
  @ApiPropertyOptional({
    enum: SupportStatus,
    description: 'Status of the support ticket',
  })
  @IsEnum(SupportStatus)
  @IsOptional()
  status?: SupportStatus;
} 