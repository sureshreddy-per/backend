import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Support, SupportStatus } from '../support/entities/support.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Buyer } from '../buyers/entities/buyer.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Support)
    private readonly supportRepository: Repository<Support>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Buyer)
    private readonly buyerRepository: Repository<Buyer>,
  ) {}

  async getDashboardStats() {
    const [
      totalCustomers,
      totalBuyers,
      openTickets,
      totalTickets,
    ] = await Promise.all([
      this.customerRepository.count(),
      this.buyerRepository.count(),
      this.supportRepository.count({
        where: { status: SupportStatus.OPEN },
      }),
      this.supportRepository.count(),
    ]);

    return {
      totalCustomers,
      totalBuyers,
      openTickets,
      totalTickets,
      ticketResolutionRate: totalTickets > 0
        ? ((totalTickets - openTickets) / totalTickets) * 100
        : 0,
    };
  }

  async getCustomerStats() {
    const customers = await this.customerRepository.find();
    return {
      total: customers.length,
      active: customers.filter(c => c.isActive).length,
      inactive: customers.filter(c => !c.isActive).length,
    };
  }

  async getBuyerStats() {
    const buyers = await this.buyerRepository.find();
    return {
      total: buyers.length,
      active: buyers.filter(b => b.isActive).length,
      inactive: buyers.filter(b => !b.isActive).length,
    };
  }

  async getSupportStats() {
    const tickets = await this.supportRepository.find();
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === SupportStatus.OPEN).length,
      inProgress: tickets.filter(t => t.status === SupportStatus.IN_PROGRESS).length,
      resolved: tickets.filter(t => t.status === SupportStatus.RESOLVED).length,
      closed: tickets.filter(t => t.status === SupportStatus.CLOSED).length,
    };
  }
} 