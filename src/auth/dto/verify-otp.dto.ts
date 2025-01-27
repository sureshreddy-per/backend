import { IsString, IsNotEmpty, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class VerifyOtpDto {
  @ApiProperty({ example: "+911234567890", description: "Mobile number in format: +91XXXXXXXXXX" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+91[1-9]\d{9}$/, {
    message: "Mobile number must be in format: +91XXXXXXXXXX (10 digits after +91)",
  })
  mobile_number: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/, { message: 'App version must be in format x.x.x' })
  @ApiProperty({ description: 'Current app version in format x.x.x' })
  app_version: string;
}
