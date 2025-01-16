import { IsString, IsUUID, IsNumber, IsOptional, Matches } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateFarmDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  farmer_id?: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsNumber()
  size_in_acres: number;

  @ApiProperty()
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
