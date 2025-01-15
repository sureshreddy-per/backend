import { IsString, IsEmail, IsOptional, IsEnum } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserStatus } from "../../users/entities/user.entity";

export class UpdateUserDetailsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  profile_picture?: string;

  @ApiPropertyOptional()
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
