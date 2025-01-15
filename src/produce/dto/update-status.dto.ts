import { IsString, IsNotEmpty, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ProduceStatus } from "../enums/produce-status.enum";

export class UpdateStatusDto {
  @ApiProperty({ enum: ProduceStatus })
  @IsEnum(ProduceStatus)
  @IsNotEmpty()
  status: ProduceStatus;
}
