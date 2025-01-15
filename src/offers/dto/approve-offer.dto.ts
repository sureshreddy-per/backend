import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

// Base DTO for price modifications
export class PriceModificationDto {
  @ApiPropertyOptional({ description: "Modified price per unit" })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price_per_unit?: number;

  @ApiPropertyOptional({ description: "Reason for price modification" })
  @IsString()
  @IsOptional()
  reason?: string;
}

// Specific DTO for offer approval
export class ApproveOfferDto extends PriceModificationDto {
  @ApiPropertyOptional({ description: "Additional notes for approval" })
  @IsString()
  @IsOptional()
  approval_notes?: string;
} 