import { IsEnum, IsOptional, IsUUID, IsDateString, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { AdminActionType } from '../entities/admin-audit-log.entity';

export class AuditLogFilterDto {
  @IsOptional()
  @IsEnum(AdminActionType)
  action?: AdminActionType;

  @IsOptional()
  @IsUUID()
  admin_id?: string;

  @IsOptional()
  @IsString()
  entity_type?: string;

  @IsOptional()
  @IsDateString()
  from_date?: Date;

  @IsOptional()
  @IsDateString()
  to_date?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
} 