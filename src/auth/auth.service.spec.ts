import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'test-id',
    mobileNumber: '+1234567890',
    email: 'test@example.com',
    name: 'Test User',
    roles: [UserRole.BUYER],
    status: UserStatus.ACTIVE,
    password: 'hashed-password',
    isBlocked: false,
    blockReason: null,
    profilePicture: null,
    metadata: null,
    lastLoginAt: null,
    verifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    produces: [],
    offers: [],
    buyerTransactions: [],
    sellerTransactions: [],
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByMobileNumber: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      mobileNumber: '+1234567890',
      name: 'Test User',
      email: 'test@example.com',
      roles: [UserRole.BUYER],
    };

    it('should register a new user successfully', async () => {
      jest.spyOn(usersService, 'findByMobileNumber').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue(mockUser);

      const result = await service.register(registerDto);
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user already exists', async () => {
      jest.spyOn(usersService, 'findByMobileNumber').mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow('User already exists');
    });
  });

  describe('requestOtp', () => {
    it('should generate and return OTP', async () => {
      const result = await service.requestOtp('+1234567890');
      expect(result).toHaveProperty('message');
      expect(result.message).toContain('OTP sent successfully');
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP and create new user if not exists', async () => {
      jest.spyOn(usersService, 'findByMobileNumber').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'sign').mockReturnValue('test-token');

      const result = await service.verifyOtp('+1234567890', '123456');
      expect(result).toHaveProperty('token');
      expect(result.token).toBe('test-token');
    });

    it('should verify OTP and return token for existing user', async () => {
      jest.spyOn(usersService, 'findByMobileNumber').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'sign').mockReturnValue('test-token');

      const result = await service.verifyOtp('+1234567890', '123456');
      expect(result).toHaveProperty('token');
      expect(result.token).toBe('test-token');
    });
  });
}); 