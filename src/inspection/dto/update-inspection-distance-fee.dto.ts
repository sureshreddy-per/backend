import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateInspectionDistanceFeeDto {
  @IsNumber()
  @Min(0)
  min_distance: number;

  @IsNumber()
  @Min(0)
  max_distance: number;

  @IsNumber()
  @Min(0)
  fee: number;

  @IsString()
  @IsOptional()
  updated_by?: string;
} 