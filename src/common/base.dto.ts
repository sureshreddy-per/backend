import { IsOptional, IsUUID, IsDate } from 'class-validator';

export class BaseDto {
  @IsUUID()
  id: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  @IsOptional()
  @IsDate()
  deletedAt?: Date;
} 