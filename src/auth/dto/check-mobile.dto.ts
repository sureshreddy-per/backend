import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CheckMobileDto {
  @ApiProperty({ example: "+1234567890" })
  @IsString()
  mobile_number: string;
}

export class CheckMobileResponseDto {
  @ApiProperty()
  isRegistered: boolean;
}
