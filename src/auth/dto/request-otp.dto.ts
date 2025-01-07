import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({ example: '+1234567890' })
  @IsString()
  mobile_number: string;
}

export class RequestOtpResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  requestId: string;
} 