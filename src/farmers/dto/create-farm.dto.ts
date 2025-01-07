import { IsString, IsNumber, IsOptional, Matches } from 'class-validator';

export class CreateFarmDto {
  @IsString()
  name: string;

  @IsNumber()
  size: number;

  @IsString()
  address: string;

  @IsString()
  @Matches(/^-?\d+\.\d+-?\d+\.\d+$/, {
    message: 'lat_lng must be in format "latitude-longitude" (e.g., "12.9716-77.5946")',
  })
  lat_lng: string;

  @IsString()
  @IsOptional()
  image?: string;
} 