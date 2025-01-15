import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  Min,
  Max,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum RatingType {
  BUYER_TO_FARMER = "BUYER_TO_FARMER",
  FARMER_TO_BUYER = "FARMER_TO_BUYER",
}

export class CreateRatingDto {
  @ApiProperty({
    description: "Transaction ID for which rating is being submitted",
  })
  @IsUUID()
  @IsNotEmpty()
  transaction_id: string;

  @ApiProperty({ description: "Rating score (1-5)" })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;

  @ApiProperty({ description: "Optional feedback comment" })
  @IsString()
  @IsOptional()
  review?: string;

  @ApiProperty({ description: "Type of rating (BUYER_TO_FARMER or FARMER_TO_BUYER)" })
  @IsEnum(RatingType)
  @IsNotEmpty()
  rating_type: RatingType;
}
