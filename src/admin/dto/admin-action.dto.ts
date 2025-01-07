import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class AdminActionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Reason must be at least 10 characters long' })
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
  reason: string;
} 