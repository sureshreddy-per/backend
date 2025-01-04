import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Support } from './entities/support.entity';
import { User } from '../auth/entities/user.entity';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(Support)
    private readonly supportRepository: Repository<Support>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userId: string, createSupportDto: CreateSupportDto): Promise<Support> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const support = this.supportRepository.create({
      ...createSupportDto,
      userId,
    });

    return this.supportRepository.save(support);
  }

  async findAll(): Promise<Support[]> {
    return this.supportRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: string): Promise<Support> {
    const support = await this.supportRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!support) {
      throw new NotFoundException(`Support ticket with ID ${id} not found`);
    }

    return support;
  }

  async update(id: string, updateSupportDto: UpdateSupportDto): Promise<Support> {
    const support = await this.findOne(id);
    Object.assign(support, updateSupportDto);
    return this.supportRepository.save(support);
  }

  async remove(id: string): Promise<void> {
    const support = await this.findOne(id);
    await this.supportRepository.remove(support);
  }
} 