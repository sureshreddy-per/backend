import { IsString, IsOptional, IsEnum, IsEmail, IsPhoneNumber, Matches } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { UserStatus } from "../../users/enums/user-status.enum";

export class UpdateUserDetailsDto {
  // User fields
  @ApiPropertyOptional({ description: "User's full name" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: "User's email address" })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: "User's mobile number" })
  @IsPhoneNumber()
  @IsOptional()
  mobile_number?: string;

  @ApiPropertyOptional({ description: "User's profile picture/avatar URL" })
  @IsString()
  @IsOptional()
  avatar_url?: string;

  @ApiPropertyOptional({ enum: UserStatus, description: "User's account status" })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiPropertyOptional({ description: "Firebase Cloud Messaging token for push notifications" })
  @IsString()
  @IsOptional()
  fcm_token?: string;

  @ApiPropertyOptional({ description: "App version in format x.x.x" })
  @IsString()
  @IsOptional()
  @Matches(/^\d+\.\d+\.\d+$/, { message: 'App version must be in format x.x.x' })
  app_version?: string;

  // Buyer fields
  @ApiPropertyOptional({ description: "Buyer's GST number" })
  @IsString()
  @IsOptional()
  gst?: string;

  @ApiPropertyOptional({ description: "Buyer's business name" })
  @IsString()
  @IsOptional()
  business_name?: string;

  @ApiPropertyOptional({ description: "Buyer's registration number" })
  @IsString()
  @IsOptional()
  registration_number?: string;

  @ApiPropertyOptional({ description: "Location in 'latitude,longitude' format (e.g., '12.9716,77.5946')" })
  @IsString()
  @IsOptional()
  @Matches(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, {
    message: "Location must be in format: latitude,longitude (e.g., 12.9716,77.5946)",
  })
  location?: string;

  @ApiPropertyOptional({ description: "Name of the location" })
  @IsString()
  @IsOptional()
  location_name?: string;

  @ApiPropertyOptional({ description: "Full address" })
  @IsString()
  @IsOptional()
  address?: string;
} 
