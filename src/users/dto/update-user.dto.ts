import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsPhoneNumber,
  IsDate,
  Matches,
} from "class-validator";
import { UserRole } from "../../enums/user-role.enum";
import { UserStatus } from '../enums/user-status.enum';
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @IsString()
  @IsOptional()
  block_reason?: string;

  @IsString()
  @IsOptional()
  fcm_token?: string;

  @IsString()
  @IsOptional()
  avatar_url?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d+\.\d+\.\d+$/, { message: 'App version must be in format x.x.x' })
  app_version?: string;

  @ApiPropertyOptional({ description: 'Last login timestamp' })
  @IsDate()
  @IsOptional()
  last_login_at?: Date;
}
