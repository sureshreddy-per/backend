import { IsString, IsUUID, IsArray, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AssessQualityDto {
  @ApiProperty({ description: "The ID of the produce to assess" })
  @IsUUID()
  produceId: string;

  @ApiProperty({ description: "Array of image URLs for quality assessment" })
  @IsArray()
  @IsString({ each: true })
  imageUrls: string[];

  @ApiPropertyOptional({
    description: "Additional metadata for quality assessment",
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
