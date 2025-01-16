import { IsString, IsNumber, IsOptional, Matches } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateFarmDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  size_in_acres?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: "Location in format 'latitude,longitude' (e.g. '12.9716,77.5946')" })
  @IsString()
  @IsOptional()
  @Matches(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, {
    message: "Location must be in format: latitude,longitude (e.g. 12.9716,77.5946)",
  })
  location?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image?: string;
}
