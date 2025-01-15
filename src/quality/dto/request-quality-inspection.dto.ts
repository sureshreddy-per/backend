import { IsNotEmpty, IsUUID, IsString, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RequestQualityInspectionDto {
  @ApiProperty({ description: "ID of the produce to be inspected" })
  @IsUUID()
  @IsNotEmpty()
  produce_id: string;

  @ApiProperty({ description: "Location where inspection needs to be performed" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, {
    message: 'Location must be in format "latitude,longitude" (e.g. "12.34,56.78")',
  })
  location: string;
} 