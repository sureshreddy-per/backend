import { IsString, IsOptional, IsEnum, IsEmail, IsPhoneNumber, Matches } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { UserStatus } from "../../users/enums/user-status.enum";

export class UpdateUserDetailsDto {
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
}
