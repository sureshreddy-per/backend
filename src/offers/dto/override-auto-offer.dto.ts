import { IsOptional, IsNumber, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { PriceModificationDto } from "./approve-offer.dto";

export class OverrideAutoOfferDto extends PriceModificationDto {
  @ApiPropertyOptional({ description: "New quantity" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;
}
