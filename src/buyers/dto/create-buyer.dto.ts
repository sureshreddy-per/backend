import { IsString, IsOptional, Matches } from "class-validator";

export class CreateBuyerDto {
  @IsString()
  business_name: string;

  @IsString()
  @IsOptional()
  gst?: string;

  @IsString()
  @IsOptional()
  registration_number?: string;

  @IsString()
  @Matches(/^-?\d+\.\d+-?\d+\.\d+$/, {
    message:
      'lat_lng must be in format "latitude-longitude" (e.g., "12.9716-77.5946")',
  })
  lat_lng: string;

  @IsString()
  address: string;
}
