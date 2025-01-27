import { IsNotEmpty, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RequestQualityInspectionDto {
  @ApiProperty({ description: "ID of the produce to be inspected" })
  @IsUUID()
  @IsNotEmpty()
  produce_id: string;
} 