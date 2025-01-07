import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { UserRole, UserStatus } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = new User();
    Object.assign(user, createUserDto);
    const savedUser = await this.userRepository.save(user);
    return savedUser;
  }

  async findAll(page = 1, limit = 10): Promise<PaginatedResponse<User>> {
    const [items, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
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

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async findByMobileNumber(mobileNumber: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { mobile_number: mobileNumber },
    });
    if (!user) {
      throw new NotFoundException(`User with mobile number ${mobileNumber} not found`);
    }
    return user;
  }

  async addRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findOne(id);
    if (!user.role.includes(role)) {
      user.role = role;
      return this.userRepository.save(user);
    }
    return user;
  }

  async removeRole(id: string, role: string): Promise<User> {
    const user = await this.findOne(id);
    if (user.role === role) {
      user.role = null;
      return this.userRepository.save(user);
    }
    return user;
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.findOne(id);
    user.status = status;
    return this.userRepository.save(user);
  }

  async block(id: string, reason: string): Promise<User> {
    const user = await this.findOne(id);
    user.status = UserStatus.BLOCKED;
    user.block_reason = reason;
    return this.userRepository.save(user);
  }

  async unblock(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.status = UserStatus.ACTIVE;
    user.block_reason = null;
    return this.userRepository.save(user);
  }
} 