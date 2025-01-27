import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "../../enums/user-role.enum";

export class RegisterDto {
  @ApiProperty({ example: "+911234567890", description: "Mobile number in format: +91XXXXXXXXXX" })
  @IsString()
  @Matches(/^\+91[1-9]\d{9}$/, {
    message: "Mobile number must be in format: +91XXXXXXXXXX (10 digits after +91)",
  })
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
