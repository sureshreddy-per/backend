import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { NotificationController } from "./controllers/notification.controller";
import { NotificationService } from "./services/notification.service";
import { Notification } from "./entities/notification.entity";
import { NotificationPreferences } from "./entities/notification-preferences.entity";
import { UsersModule } from "../users/users.module";
import { NotificationListener } from './listeners/notification.listener';
import { RetentionService } from './services/retention.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationPreferences]),
    EventEmitterModule.forRoot(),
    UsersModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationListener,
    RetentionService,
  ],
  exports: [NotificationService],
})
export class NotificationsModule {}
