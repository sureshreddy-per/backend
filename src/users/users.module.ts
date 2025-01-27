import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { User } from "./entities/user.entity";
import { UsersService } from "./services/users.service";
import { UserCleanupTask } from "./tasks/user-cleanup.task";
import { UsersController } from "./controllers/users.controller";
import { MediaModule } from "../media/media.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ScheduleModule.forRoot(),
    MediaModule,
  ],
  providers: [UsersService, UserCleanupTask],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
