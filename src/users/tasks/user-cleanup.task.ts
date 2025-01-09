import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from '../services/users.service';

@Injectable()
export class UserCleanupTask {
  private readonly logger = new Logger(UserCleanupTask.name);

  constructor(private readonly usersService: UsersService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleUserDeletion() {
    try {
      this.logger.log('Starting scheduled user deletion task');
      await this.usersService.deleteExpiredUsers();
      this.logger.log('Completed scheduled user deletion task');
    } catch (error) {
      this.logger.error('Error in scheduled user deletion task', error.stack);
    }
  }
} 