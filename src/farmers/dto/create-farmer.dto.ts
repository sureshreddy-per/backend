import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateFarmerDto {
  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
} 