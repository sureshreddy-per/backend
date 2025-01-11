import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "../../enums/user-role.enum";

export class RegisterDto {
  @ApiProperty({ example: "+1234567890" })
  @IsString()
  mobile_number: string;

  @ApiProperty({ example: "John Doe" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: "john@example.com" })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.FARMER })
  @IsEnum(UserRole)
  role: UserRole;
}
