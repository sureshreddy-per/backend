import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, ArrayMinSize } from "class-validator";
import { SupportTicketCategory, SupportTicketPriority } from "../entities/support-ticket.entity";

export class CreateSupportTicketDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(SupportTicketCategory)
  @IsOptional()
  category?: SupportTicketCategory;

  @IsEnum(SupportTicketPriority)
  @IsOptional()
  priority?: SupportTicketPriority;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
