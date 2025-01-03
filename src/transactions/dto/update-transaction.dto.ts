import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateTransactionDto } from './create-transaction.dto';
import { TransactionStatus } from '../entities/transaction.entity';

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {
  @ApiPropertyOptional({ enum: TransactionStatus, description: 'Status of the transaction' })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;
} 