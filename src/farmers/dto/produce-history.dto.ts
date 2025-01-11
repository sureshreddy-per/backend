import { Type } from "class-transformer";
import { IsOptional, IsDate, IsString } from "class-validator";

export class ProduceHistoryQueryDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsString()
  produceType?: string;
}

export class TransactionDto {
  id: string;
  quantity: number;
  pricePerUnit: number;
  status: string;
  createdAt: Date;
  buyer: {
    id: string;
    name: string;
    rating: number;
  };
}

export class ProduceHistoryResponseDto {
  transactions: TransactionDto[];
  meta: {
    total: number;
    totalValue: number;
    averagePrice: number;
  };
}
