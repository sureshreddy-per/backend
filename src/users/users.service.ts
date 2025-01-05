import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  async findByMobileNumber(mobileNumber: string): Promise<User> {
    return this.userRepository.findOne({ where: { mobileNumber } });
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    await this.findOne(id); // Verify user exists
    await this.userRepository.update(id, userData);
    return this.findOne(id);
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.findOne(id);
    user.status = status;
    return this.userRepository.save(user);
  }

  async addRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findOne(id);
    if (!user.roles.includes(role)) {
      user.roles.push(role);
      return this.userRepository.save(user);
    }
    return user;
  }

  async removeRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findOne(id);
    user.roles = user.roles.filter(r => r !== role);
    return this.userRepository.save(user);
  }

  async block(id: string, reason: string): Promise<User> {
    const user = await this.findOne(id);
    user.isBlocked = true;
    user.blockReason = reason;
    return this.userRepository.save(user);
  }

  async unblock(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isBlocked = false;
    user.blockReason = null;
    return this.userRepository.save(user);
  }
} 