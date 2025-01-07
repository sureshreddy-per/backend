import { IsString, IsUUID, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus } from '../entities/transaction.entity';

export class CreateTransactionDto {
  @ApiProperty()
  @IsUUID()
  offer_id: string;

  @ApiProperty()
  @IsUUID()
  farmer_id: string;

  @ApiProperty()
  @IsUUID()
  buyer_id: string;

  @ApiProperty()
  @IsUUID()
  produce_id: string;

  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiProperty()
  @IsNumber()
  final_price: number;

  @ApiProperty()
  @IsNumber()
  quantity: number;
} 