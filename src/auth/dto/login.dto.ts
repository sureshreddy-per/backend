import { IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'User\'s email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User\'s password' })
  @IsString()
  password: string;
} 