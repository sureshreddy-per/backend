import { IsString, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CheckMobileDto {
  @ApiProperty({ example: "+911234567890", description: "Mobile number in format: +91XXXXXXXXXX" })
  @IsString()
  @Matches(/^\+91[1-9]\d{9}$/, {
    message: "Mobile number must be in format: +91XXXXXXXXXX (10 digits after +91)",
  })
  mobile_number: string;
}

export class CheckMobileResponseDto {
  @ApiProperty()
  isRegistered: boolean;
}
