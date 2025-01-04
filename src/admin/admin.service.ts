import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Support, SupportStatus } from '../support/entities/support.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Support)
    private readonly supportRepository: Repository<Support>,
  ) {}

  async getUsers() {
    return this.userRepository.find();
  }

  async getUser(id: string) {
    return this.userRepository.findOne({ where: { id } });
  }

  async blockUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }
    user.isBlocked = true;
    return this.userRepository.save(user);
  }

  async unblockUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }
    user.isBlocked = false;
    return this.userRepository.save(user);
  }

  async getSupportTickets() {
    return this.supportRepository.find({
      relations: ['user'],
    });
  }

  async updateSupportTicket(id: string, status: SupportStatus) {
    const ticket = await this.supportRepository.findOne({ where: { id } });
    if (!ticket) {
      throw new Error('Support ticket not found');
    }
    ticket.status = status;
    return this.supportRepository.save(ticket);
  }
} 