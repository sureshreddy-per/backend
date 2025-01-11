import { IsString, IsUUID, IsBoolean, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateBankAccountDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  farmer_id?: string;

  @ApiProperty()
  @IsString()
  account_name: string;

  @ApiProperty()
  @IsString()
  account_number: string;

  @ApiProperty()
  @IsString()
  bank_name: string;

  @ApiProperty()
  @IsString()
  branch_code: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;
}
