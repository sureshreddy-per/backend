import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { Customer } from '../customers/entities/customer.entity';
import { Buyer } from '../buyers/entities/buyer.entity';
import { Role } from './enums/role.enum';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let customerRepository: Repository<Customer>;
  let buyerRepository: Repository<Buyer>;
  let jwtService: JwtService;

  const mockCustomerRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockBuyerRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: getRepositoryToken(Buyer),
          useValue: mockBuyerRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    customerRepository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
    buyerRepository = module.get<Repository<Buyer>>(getRepositoryToken(Buyer));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should validate customer and return user data with role', async () => {
      const mockCustomer = {
        id: 'test-id',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
      };

      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toEqual({
        id: mockCustomer.id,
        email: mockCustomer.email,
        role: Role.CUSTOMER,
      });
    });

    it('should validate buyer and return user data with role', async () => {
      const mockBuyer = {
        id: 'test-id',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
      };

      mockCustomerRepository.findOne.mockResolvedValue(null);
      mockBuyerRepository.findOne.mockResolvedValue(mockBuyer);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toEqual({
        id: mockBuyer.id,
        email: mockBuyer.email,
        role: Role.BUYER,
      });
    });

    it('should return null for invalid credentials', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(null);
      mockBuyerRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('verifyPhone', () => {
    it('should throw error if phone is already registered', async () => {
      const mockCustomer = {
        id: 'test-id',
        phone: '+1234567890',
      };

      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer);

      await expect(service.verifyPhone({ phone: '+1234567890' }))
        .rejects.toThrow('Phone number already registered');
    });

    it('should create temporary customer record and return success message', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(null);
      mockCustomerRepository.create.mockReturnValue({
        phone: '+1234567890',
      });

      const result = await service.verifyPhone({ phone: '+1234567890' });

      expect(result).toEqual({ message: 'Verification code sent' });
      expect(mockCustomerRepository.create).toHaveBeenCalledWith({
        phone: '+1234567890',
      });
    });
  });

  describe('verifyEmail', () => {
    it('should throw error if email is already registered', async () => {
      mockCustomerRepository.findOne.mockResolvedValue({ id: 'test-id' });

      await expect(service.verifyEmail('test@example.com'))
        .rejects.toThrow('Email already registered');
    });

    it('should return success message for new email', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(null);
      mockBuyerRepository.findOne.mockResolvedValue(null);

      const result = await service.verifyEmail('test@example.com');

      expect(result).toEqual({ message: 'Verification email sent' });
    });
  });

  describe('login', () => {
    it('should return access token and user data', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com',
        role: Role.CUSTOMER,
      };

      mockJwtService.sign.mockReturnValue('mock-token');

      const result = await service.login(mockUser);

      expect(result).toEqual({
        access_token: 'mock-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
      });
    });
  });
}); 