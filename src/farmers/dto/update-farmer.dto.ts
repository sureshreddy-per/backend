import { IsNotEmpty, IsNumber, IsOptional, IsString, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BankDetailsDto } from './bank-details.dto';
import { CreateFarmDetailsDto } from './farm-details.dto';

export class UpdateFarmerDto {
    @IsNotEmpty()
    @IsNumber()
    farmer_id: number;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsNotEmpty()
    @IsNumber()
    updated_by: number;

    @ApiProperty({ description: 'Bank account details' })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => BankDetailsDto)
    bankDetails?: BankDetailsDto;

    @ApiProperty({ description: 'Farm details array' })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateFarmDetailsDto)
    farms?: CreateFarmDetailsDto[];
} 