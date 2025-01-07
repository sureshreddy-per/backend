import { IsUUID, IsNumber, IsString, Min, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ description: 'ID of the produce being transacted' })
  @IsUUID()
  produce_id: string;

  @ApiProperty({ description: 'Quantity of produce being transacted' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ description: 'Notes about the transaction' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata for the transaction' })
  @IsOptional()
  metadata?: Record<string, any>;
} 