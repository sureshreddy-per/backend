import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  IsOptional,
  Min,
  Max,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

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
  comment?: string;

  @ApiProperty({ description: "Specific aspects ratings", required: false })
  @IsOptional()
  aspects?: {
    quality_accuracy?: number; // How accurate was the quality assessment
    communication?: number; // Communication during transaction
    reliability?: number; // Reliability of the other party
    timeliness?: number; // Timeliness in responses/delivery
  };
}
