import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateBankAccountDto {
  @IsString()
  account_name: string;

  @IsString()
  account_number: string;

  @IsString()
  bank_name: string;

  @IsString()
  branch_code: string;

  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;
} 