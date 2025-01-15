import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindManyOptions, LessThanOrEqual } from "typeorm";
import { User, UserStatus } from "../entities/user.entity";
import { UserRole } from "../../enums/user-role.enum";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { PaginatedResponse } from "../../common/interfaces/paginated-response.interface";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(page = 1, limit = 10): Promise<PaginatedResponse<User>> {
    const [items, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: "DESC" },
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByMobileNumber(mobile_number: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { mobile_number } });
    if (!user) {
      throw new NotFoundException(`User with mobile number ${mobile_number} not found`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.findOne(id);
    user.status = status;
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({ where: { role } });
  }

  async verifyUser(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.status = UserStatus.ACTIVE;
    return this.userRepository.save(user);
  }

  async blockUser(id: string, reason: string): Promise<User> {
    const user = await this.findOne(id);
    user.status = UserStatus.BLOCKED;
    user.block_reason = reason;
    return this.userRepository.save(user);
  }

  async unblockUser(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.status = UserStatus.ACTIVE;
    user.block_reason = null;
    return this.userRepository.save(user);
  }

  async scheduleForDeletion(
    id: string,
    daysUntilDeletion: number,
  ): Promise<User> {
    const user = await this.findOne(id);
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + daysUntilDeletion);
    user.scheduled_for_deletion_at = deletionDate;
    return this.userRepository.save(user);
  }

  async cancelDeletionSchedule(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.scheduled_for_deletion_at = null;
    return this.userRepository.save(user);
  }

  async updateFCMToken(id: string, fcmToken: string): Promise<void> {
    await this.userRepository.update(id, { fcm_token: fcmToken });
  }

  async getFCMToken(id: string): Promise<string | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    return user?.fcm_token || null;
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<User> {
    const user = await this.findOne(id);
    user.avatar_url = avatarUrl;
    return this.userRepository.save(user);
  }

  async deleteExpiredUsers(): Promise<void> {
    const now = new Date();
    await this.userRepository.delete({
      scheduled_for_deletion_at: LessThanOrEqual(now),
    });
  }

  async count(): Promise<number> {
    return this.userRepository.count();
  }

  async countByStatus(status: UserStatus): Promise<number> {
    return this.userRepository.count({ where: { status } });
  }

  async getStats() {
    const [totalUsers, activeUsers, blockedUsers, farmers, buyers, inspectors] =
      await Promise.all([
        this.count(),
        this.countByStatus(UserStatus.ACTIVE),
        this.countByStatus(UserStatus.BLOCKED),
        this.userRepository.count({ where: { role: UserRole.FARMER } }),
        this.userRepository.count({ where: { role: UserRole.BUYER } }),
        this.userRepository.count({ where: { role: UserRole.INSPECTOR } }),
      ]);

    return {
      total: totalUsers,
      active: activeUsers,
      blocked: blockedUsers,
      farmers,
      buyers,
      inspectors,
    };
  }
}
