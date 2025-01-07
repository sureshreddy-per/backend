import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findByMobileNumber(mobile_number: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { mobile_number } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
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

  async addRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findOne(id);
    if (user.role !== role) {
      user.role = role;
      await this.userRepository.save(user);
    }
    return user;
  }

  async removeRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findOne(id);
    if (user.role === role) {
      user.role = null;
      await this.userRepository.save(user);
    }
    return user;
  }

  async block(id: string, reason: string): Promise<User> {
    const user = await this.findOne(id);
    user.status = UserStatus.SUSPENDED;
    user.block_reason = reason;
    return this.userRepository.save(user);
  }

  async unblock(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.status = UserStatus.ACTIVE;
    user.block_reason = null;
    return this.userRepository.save(user);
  }

  async remove(user: User): Promise<void> {
    await this.userRepository.remove(user);
  }

  async scheduleForDeletion(id: string, scheduledDate: Date): Promise<User> {
    const user = await this.findOne(id);
    user.status = UserStatus.DELETED;
    user.scheduled_for_deletion_at = scheduledDate;
    return this.userRepository.save(user);
  }
} 