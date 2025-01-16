import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "../../enums/user-role.enum";
import { UserStatus } from "../enums/user-status.enum";

export class CreateUserDto {
  @ApiProperty({ example: "+1234567890" })
  @IsString()
  mobile_number: string;

  @ApiPropertyOptional({ example: "john@example.com" })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: "John Doe" })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  profile_picture?: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
