import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TicketType } from '../enums/ticket-type.enum';

export class CreateTicketDto {
  @ApiProperty({
    description: 'The ID of the user creating the ticket',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'The type of the ticket',
    enum: TicketType,
    example: TicketType.SUPPORT,
  })
  @IsEnum(TicketType)
  @IsNotEmpty()
  type: TicketType;

  @ApiProperty({
    description: 'The description of the ticket',
    example: 'I need help with my order',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
} 