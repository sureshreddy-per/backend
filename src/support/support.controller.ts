import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { SupportTicket } from './entities/support-ticket.entity';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  create(@Body() createSupportTicketDto: CreateSupportTicketDto): Promise<SupportTicket> {
    return this.supportService.create(createSupportTicketDto);
  }

  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedResponse<SupportTicket>> {
    return this.supportService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<SupportTicket> {
    return this.supportService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateSupportTicketDto: UpdateSupportTicketDto,
  ): Promise<SupportTicket> {
    return this.supportService.update(id, updateSupportTicketDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.supportService.remove(id);
  }

  @Get('user/:userId')
  findByUser(
    @Param('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedResponse<SupportTicket>> {
    return this.supportService.findByUser(userId, page, limit);
  }
} 