import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
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

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phone } });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({ where: { role } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
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

  async scheduleForDeletion(id: string, daysUntilDeletion: number = 30): Promise<User> {
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

  async updateLoginAttempts(id: string, reset: boolean = false): Promise<User> {
    const user = await this.findOne(id);
    if (reset) {
      user.login_attempts = 0;
    } else {
      user.login_attempts = (user.login_attempts || 0) + 1;
      if (user.login_attempts >= 5) {
        user.status = UserStatus.BLOCKED;
        user.block_reason = 'Too many failed login attempts';
      }
    }
    return this.userRepository.save(user);
  }

  async updateLastLogin(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.last_login_at = new Date();
    user.login_attempts = 0;
    return this.userRepository.save(user);
  }

  async updateFCMToken(id: string, fcmToken: string): Promise<User> {
    const user = await this.findOne(id);
    user.fcm_token = fcmToken;
    return this.userRepository.save(user);
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<User> {
    const user = await this.findOne(id);
    user.avatar_url = avatarUrl;
    return this.userRepository.save(user);
  }
} 