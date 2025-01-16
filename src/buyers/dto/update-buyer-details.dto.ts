import { IsString, IsOptional, Matches } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateBuyerDetailsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: "Location in 'latitude,longitude' format (e.g., '12.9716,77.5946')" })
  @IsOptional()
  @IsString()
  @Matches(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, {
    message: "Location must be in format: latitude,longitude (e.g., 12.9716,77.5946)",
  })
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registration_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  business_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gst?: string;
}
