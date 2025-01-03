import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ProduceStatus {
  PENDING = 'PENDING',
  ASSESSED = 'ASSESSED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINAL_PRICE = 'FINAL_PRICE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class UpdateStatusDto {
  @ApiProperty({ enum: ProduceStatus })
  @IsEnum(ProduceStatus)
  @IsNotEmpty()
  status: ProduceStatus;
} 