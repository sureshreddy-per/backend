import { IsEmail, IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mobileNumber: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  farmLat?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  farmLng?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactVisibility?: 'public' | 'premium';
} 