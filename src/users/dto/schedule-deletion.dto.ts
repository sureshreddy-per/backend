import { IsNumber, IsOptional, Min } from 'class-validator';

export class ScheduleDeletionDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  daysUntilDeletion?: number;
} 