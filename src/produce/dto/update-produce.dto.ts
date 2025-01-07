import { OmitType, PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateProduceDto } from './create-produce.dto';
import { IsOptional, IsString, IsArray } from 'class-validator';
import { ProduceStatus } from '../entities/produce.entity';

export class UpdateProduceDto extends PartialType(
  OmitType(CreateProduceDto, ['farmerId'] as const)
) {
  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  video?: string;

  @ApiProperty({ enum: ProduceStatus, required: false })
  @IsOptional()
  status?: ProduceStatus;
} 