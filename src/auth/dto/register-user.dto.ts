import { IsString, IsEmail, IsPhoneNumber, IsBoolean, IsOptional, MinLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({ description: 'User\'s full name' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ description: 'User\'s email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User\'s phone number' })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({ description: 'User\'s password (min 8 chars, must include number and special char)' })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character',
  })
  password: string;

  @ApiPropertyOptional({ description: 'Whether the user is a farmer' })
  @IsBoolean()
  @IsOptional()
  isFarmer?: boolean;

  @ApiPropertyOptional({ description: 'Whether the user is a buyer' })
  @IsBoolean()
  @IsOptional()
  isBuyer?: boolean;

  @ApiPropertyOptional({ description: 'User\'s business profile information' })
  @IsOptional()
  profile?: {
    businessName?: string;
    address?: string;
    taxId?: string;
    website?: string;
  };
} 