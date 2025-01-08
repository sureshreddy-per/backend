import { Controller, Get, Post, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findMyUnread(@GetUser() user: User) {
    return this.notificationsService.findUnreadByUser(user.id);
  }

  @Post('mark-all-read')
  markAllAsRead(@GetUser() user: User) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Post(':id/mark-read')
  async markAsRead(
    @GetUser() user: User,
    @Param('id') id: string
  ) {
    const notification = await this.notificationsService.findOne(id);

    if (notification.user_id !== user.id) {
      throw new UnauthorizedException('You can only mark your own notifications as read');
    }

    return this.notificationsService.markAsRead(id);
  }
}