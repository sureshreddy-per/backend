import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class RequestAiVerificationDto {
  @ApiProperty({ description: "ID of the produce to verify" })
  @IsUUID()
  produce_id: string;
} 