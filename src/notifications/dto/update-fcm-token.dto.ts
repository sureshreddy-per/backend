import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFCMTokenDto {
  @ApiProperty({ description: 'Firebase Cloud Messaging token for push notifications' })
  @IsString()
  @IsNotEmpty()
  fcm_token: string;
} 