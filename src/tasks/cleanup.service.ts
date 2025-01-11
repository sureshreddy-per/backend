import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, Repository } from "typeorm";
import { User, UserStatus } from "../users/entities/user.entity";

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDeletedAccounts() {
    this.logger.log("Starting cleanup of deleted accounts...");

    try {
      const now = new Date();
      const usersToDelete = await this.userRepository.find({
        where: {
          status: UserStatus.DELETED,
          scheduled_for_deletion_at: LessThan(now),
        },
      });

      for (const user of usersToDelete) {
        await this.userRepository.remove(user);
        this.logger.log(`Permanently deleted user: ${user.id}`);
      }

      this.logger.log(
        `Cleanup completed. Deleted ${usersToDelete.length} accounts.`,
      );
    } catch (error) {
      this.logger.error("Error during account cleanup:", error);
    }
  }
}
