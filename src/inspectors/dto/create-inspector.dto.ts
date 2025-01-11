import { IsString, IsNotEmpty, Matches } from "class-validator";

export class CreateInspectorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: "Mobile number must be in E.164 format (e.g., +1234567890)",
  })
  mobile_number: string;

  @IsString()
  @Matches(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, {
    message: "Location must be in format: latitude,longitude (e.g. 12.9716,77.5946)",
  })
  location: string;

  @IsString()
  @IsNotEmpty()
  user_id: string;
} 