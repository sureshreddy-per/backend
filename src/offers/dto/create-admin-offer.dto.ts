import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateAdminOfferDto {
  @ApiProperty({ description: "Buyer's ID" })
  @IsUUID()
  @IsNotEmpty()
  buyer_id: string;

  @ApiProperty({ description: "Farmer's ID" })
  @IsUUID()
  @IsNotEmpty()
  farmer_id: string;

  @ApiProperty({ description: "Produce ID" })
  @IsUUID()
  @IsNotEmpty()
  produce_id: string;

  @ApiProperty({ description: "Price per unit" })
  @IsNumber()
  @Min(0)
  price_per_unit: number;

  @ApiProperty({ description: "Quantity" })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: "Optional message", required: false })
  @IsOptional()
  message?: string;
} 