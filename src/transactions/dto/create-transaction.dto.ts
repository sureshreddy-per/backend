import { IsUUID, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ description: 'ID of the produce being transacted' })
  @IsUUID()
  produceId: string;

  @ApiProperty({ description: 'Quantity of produce being transacted' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Total cost of the transaction' })
  @IsNumber()
  @Min(0)
  totalCost: number;

  @ApiPropertyOptional({ description: 'Additional metadata for the transaction' })
  @IsOptional()
  metadata?: Record<string, any>;
} 