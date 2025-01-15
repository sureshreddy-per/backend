import { IsString, IsOptional, Matches } from "class-validator";

export class UpdateInspectorDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, {
    message: "Location must be in format: latitude,longitude (e.g. 12.9716,77.5946)",
  })
  location?: string;
}
