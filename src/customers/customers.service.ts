import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customerRepository.create(createCustomerDto);
    return this.customerRepository.save(customer);
  }

  async findAll(): Promise<Customer[]> {
    return this.customerRepository.find();
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }

  async findByEmail(email: string): Promise<Customer> {
    return this.customerRepository.findOne({ where: { email } });
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    Object.assign(customer, updateCustomerDto);
    return this.customerRepository.save(customer);
  }

  async updateLocation(id: string, lat: number, lng: number): Promise<Customer> {
    const customer = await this.findOne(id);
    customer.latestLat = lat;
    customer.latestLng = lng;
    return this.customerRepository.save(customer);
  }

  async block(id: string): Promise<Customer> {
    const customer = await this.findOne(id);
    customer.blockedStatus = true;
    return this.customerRepository.save(customer);
  }

  async unblock(id: string): Promise<Customer> {
    const customer = await this.findOne(id);
    customer.blockedStatus = false;
    return this.customerRepository.save(customer);
  }

  async updateRating(id: string, rating: number): Promise<Customer> {
    const customer = await this.findOne(id);
    customer.rating = rating;
    return this.customerRepository.save(customer);
  }

  async updateHonestyRating(id: string, rating: number): Promise<Customer> {
    const customer = await this.findOne(id);
    customer.honestyRating = rating;
    return this.customerRepository.save(customer);
  }

  async updateTotalValue(id: string, value: number): Promise<Customer> {
    const customer = await this.findOne(id);
    customer.totalValue = value;
    return this.customerRepository.save(customer);
  }
} 