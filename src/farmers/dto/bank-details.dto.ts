import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class BankDetailsDto {
  @ApiProperty({ description: 'Name on the bank account' })
  @IsString()
  accountName: string;

  @ApiProperty({ description: 'Bank account number' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ description: 'Name of the bank' })
  @IsString()
  bankName: string;

  @ApiProperty({ description: 'Branch code or routing number' })
  @IsString()
  branchCode: string;
} 