import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/services/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { FarmersService } from '../farmers/farmers.service';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'test-id',
    mobile_number: '+1234567890',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.BUYER,
    status: UserStatus.ACTIVE,
    block_reason: null,
    profile_picture: null,
    last_login_at: null,
    scheduled_for_deletion_at: null,
    login_attempts: 0,
    last_login_attempt: null,
    created_at: new Date(),
    updated_at: new Date(),
    fcm_token: null,
    avatar_url: null
  } as User;

  const mockUsersService = {
    findByMobileNumber: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockRedisService = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const mockFarmersService = {
    createFarmer: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: FarmersService,
          useValue: mockFarmersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});