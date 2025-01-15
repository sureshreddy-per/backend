import { IsEnum, IsUUID, IsOptional, IsObject } from "class-validator";
import { TransactionEvent } from "../entities/transaction-history.entity";
import { TransactionStatus } from "../entities/transaction.entity";
import { BaseDto } from "../../common/base.dto";

export class TransactionHistoryDto extends BaseDto {
  @IsUUID()
  transactionId: string;

  @IsEnum(TransactionEvent)
  event: TransactionEvent;

  @IsOptional()
  @IsEnum(TransactionStatus)
  oldStatus?: TransactionStatus;

  @IsOptional()
  @IsEnum(TransactionStatus)
  newStatus?: TransactionStatus;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
