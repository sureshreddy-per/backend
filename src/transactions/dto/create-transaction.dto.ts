import { IsUUID, IsNumber, Min } from "class-validator";

export class CreateTransactionDto {
  @IsUUID()
  offer_id: string;

  @IsUUID()
  produce_id: string;

  @IsNumber()
  @Min(0)
  final_price: number;

  @IsNumber()
  @Min(0)
  final_quantity: number;
}
