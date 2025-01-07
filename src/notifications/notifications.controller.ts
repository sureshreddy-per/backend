import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, DefaultValuePipe, Patch } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Notification } from './entities/notification.entity';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto): Promise<Notification> {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<PaginatedResponse<Notification>> {
    return this.notificationsService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Notification> {
    return this.notificationsService.findOne(id);
  }

  @Get('user/:userId')
  findByUser(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<PaginatedResponse<Notification>> {
    return this.notificationsService.findByUser(userId, page, limit);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string): Promise<Notification> {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('user/:userId/read-all')
  markAllAsRead(@Param('userId') userId: string): Promise<void> {
    return this.notificationsService.markAllAsRead(userId);
  }
} 