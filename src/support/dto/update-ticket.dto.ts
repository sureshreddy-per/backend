import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '../enums/ticket-status.enum';

export class UpdateTicketDto {
  @ApiPropertyOptional({
    description: 'The status of the ticket',
    enum: TicketStatus,
    example: TicketStatus.IN_PROGRESS,
  })
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;
} 