import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    ConfigModule,
  ],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {} 