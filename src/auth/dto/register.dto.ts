import { IsString, IsEmail, IsOptional, IsArray, ArrayUnique, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @ApiProperty({ description: 'User\'s full name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Mobile number in E.164 format', example: '+1234567890' })
  @IsString()
  mobileNumber: string;

  @ApiPropertyOptional({ description: 'User\'s email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ 
    description: 'User roles', 
    enum: UserRole, 
    isArray: true,
    example: [UserRole.FARMER]
  })
  @IsArray()
  @ArrayUnique()
  @IsEnum(UserRole, { each: true })
  roles: UserRole[];
} 