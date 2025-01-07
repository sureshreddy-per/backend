import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: '+1234567890' })
  @IsString()
  mobile_number: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;
} 