import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class LocationDto {
  @ApiProperty({ description: "Latitude coordinate" })
  @IsNumber()
  @IsOptional()
  lat: number;

  @ApiProperty({ description: "Longitude coordinate" })
  @IsNumber()
  @IsOptional()
  lng: number;
}

export class CreateFarmDetailsDto {
  @ApiProperty({ description: "Farm name or identifier" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: "Farm size" })
  @IsNumber()
  @IsOptional()
  size?: number;

  @ApiProperty({ description: "Farm size unit" })
  @IsString()
  @IsOptional()
  sizeUnit?: string;

  @ApiProperty({ description: "Farm address or location description" })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: "Farm location coordinates" })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}

export class UpdateFarmDetailsDto extends CreateFarmDetailsDto {}
