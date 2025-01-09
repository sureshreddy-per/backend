import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { User } from './entities/user.entity';
import { UsersService } from './services/users.service';
import { UserCleanupTask } from './tasks/user-cleanup.task';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ScheduleModule.forRoot(),
  ],
  providers: [UsersService, UserCleanupTask],
  exports: [UsersService],
})
export class UsersModule {} 