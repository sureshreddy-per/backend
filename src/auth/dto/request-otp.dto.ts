import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({
    description: 'Mobile number in E.164 format',
    example: '+1234567890'
  })
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Mobile number must be in E.164 format (e.g., +1234567890)',
  })
  mobileNumber: string;
}

export class RequestOtpResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'OTP sent successfully'
  })
  message: string;

  @ApiProperty({
    description: 'Unique request ID for this OTP request',
    example: 'abc123xyz'
  })
  requestId: string;
} 