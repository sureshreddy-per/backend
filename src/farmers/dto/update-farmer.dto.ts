import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsObject, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateFarmDetailsDto } from './farm-details.dto';
import { BankDetailsDto } from './bank-details.dto';

export class UpdateFarmerDto {
  @ApiProperty({ description: 'Farm details array', type: [CreateFarmDetailsDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFarmDetailsDto)
  farms?: CreateFarmDetailsDto[];

  @ApiProperty({ description: 'Bank account details' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto;
} 