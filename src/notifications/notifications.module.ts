import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationController } from "./controllers/notification.controller";
import { NotificationService } from "./services/notification.service";
import { Notification } from "./entities/notification.entity";
import { NotificationPreferences } from "./entities/notification-preferences.entity";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationPreferences]),
    UsersModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
