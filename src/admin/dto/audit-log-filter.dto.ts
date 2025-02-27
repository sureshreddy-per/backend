import { IsDateString, IsOptional, IsEnum, IsUUID } from "class-validator";
import { AdminActionType } from "../enums/admin-action-type.enum";

export class AuditLogFilterDto {
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;

  @IsEnum(AdminActionType)
  @IsOptional()
  action?: AdminActionType;

  @IsUUID()
  @IsOptional()
  admin_id?: string;

  @IsUUID()
  @IsOptional()
  entity_id?: string;
}
