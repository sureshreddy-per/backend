import { IsString, IsOptional, IsEnum } from "class-validator";
import { SupportTicketCategory, SupportTicketPriority, SupportTicketStatus } from "../entities/support-ticket.entity";

export class UpdateSupportTicketDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(SupportTicketCategory)
  @IsOptional()
  category?: SupportTicketCategory;

  @IsEnum(SupportTicketPriority)
  @IsOptional()
  priority?: SupportTicketPriority;

  @IsEnum(SupportTicketStatus)
  @IsOptional()
  status?: SupportTicketStatus;

  @IsOptional()
  attachments?: string[];
}
