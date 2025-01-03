import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Customer } from '../customers/entities/customer.entity';
import { Buyer } from '../buyers/entities/buyer.entity';
import { Role } from './enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Buyer)
    private readonly buyerRepository: Repository<Buyer>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const customer = await this.customerRepository.findOne({ where: { email } });
    if (customer && await bcrypt.compare(password, customer.password)) {
      const { password, ...result } = customer;
      return { ...result, role: Role.CUSTOMER };
    }

    const buyer = await this.buyerRepository.findOne({ where: { email } });
    if (buyer && await bcrypt.compare(password, buyer.password)) {
      const { password, ...result } = buyer;
      return { ...result, role: Role.BUYER };
    }

    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async verifyPhone(data: { phone: string }) {
    const customer = await this.customerRepository.findOne({
      where: { phone: data.phone },
    });

    if (customer) {
      throw new BadRequestException('Phone number already registered');
    }

    // Create a temporary customer record
    const tempCustomer = this.customerRepository.create({
      phone: data.phone,
    });

    // In a real application, you would send an OTP to the phone number here
    // For now, we'll just return a success message
    return { message: 'Verification code sent' };
  }

  async verifyEmail(email: string) {
    const customer = await this.customerRepository.findOne({ where: { email } });
    const buyer = await this.buyerRepository.findOne({ where: { email } });

    if (customer || buyer) {
      throw new BadRequestException('Email already registered');
    }

    // In a real application, you would send a verification email here
    // For now, we'll just return a success message
    return { message: 'Verification email sent' };
  }
} 