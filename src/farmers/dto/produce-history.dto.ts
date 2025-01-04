import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { TransactionStatus } from '../../transactions/entities/transaction.entity';

export class ProduceHistoryQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsEnum(TransactionStatus)
  transactionStatus?: TransactionStatus;
}

export interface BuyerDto {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface TransactionDto {
  id: string;
  produceId: string;
  amount: number;
  quantity: number;
  unit: string;
  totalCost: number;
  status: TransactionStatus;
  createdAt: Date;
  buyer: BuyerDto | null;
}

export interface ProduceHistoryResponseDto {
  farmerId: string;
  userId: string;
  transactions: TransactionDto[];
  total: number;
  page: number;
  limit: number;
} 