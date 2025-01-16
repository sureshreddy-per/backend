import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RequestAiVerificationDto {
  @ApiProperty({ description: 'ID of the produce to verify' })
  @IsString()
  @IsNotEmpty()
  produce_id: string;

  @ApiProperty({ description: 'URL of the image to analyze' })
  @IsString()
  @IsNotEmpty()
  image_url: string;
} 