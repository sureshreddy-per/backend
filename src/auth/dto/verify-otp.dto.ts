import { IsString, IsNotEmpty, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class VerifyOtpDto {
  @ApiProperty({ example: "+1234567890" })
  @IsString()
  @IsNotEmpty()
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
