import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AddResponseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  response: string;
}
