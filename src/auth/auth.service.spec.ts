import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let eventEmitter: EventEmitter2;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user and return token', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        phone: '+1234567890',
        isFarmer: true,
        isBuyer: false,
        name: 'Test User',
      };

      const mockUser = {
        id: 'test-id',
        email: registerDto.email,
        phone: registerDto.phone,
        isFarmer: registerDto.isFarmer,
        isBuyer: registerDto.isBuyer,
        verificationStatus: 'PENDING',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-token');

      const result = await service.register(registerDto);

      expect(result).toEqual({
        user: mockUser,
        token: 'mock-token',
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('user.registered', {
        userId: mockUser.id,
        isFarmer: mockUser.isFarmer,
        isBuyer: mockUser.isBuyer,
      });
    });

    it('should throw error if user already exists', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        phone: '+1234567890',
        isFarmer: true,
        isBuyer: false,
        name: 'Test User',
      };

      mockUserRepository.findOne.mockResolvedValue({ id: 'existing-id' });

      await expect(service.register(registerDto)).rejects.toThrow('User with this email or phone already exists');
    });
  });

  describe('login', () => {
    it('should login user and return token', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'test-id',
        email: loginDto.email,
        passwordHash: await bcrypt.hash(loginDto.password, 12),
        isFarmer: true,
        isBuyer: false,
        isBlocked: false,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
        }),
        token: 'mock-token',
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('user.loggedIn', {
        userId: mockUser.id,
        isFarmer: mockUser.isFarmer,
        isBuyer: mockUser.isBuyer,
      });
    });

    it('should throw error if user is blocked', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'test-id',
        email: loginDto.email,
        passwordHash: await bcrypt.hash(loginDto.password, 12),
        isBlocked: true,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow('Account is blocked');
    });
  });

  describe('validateUser', () => {
    it('should validate and return user', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        isBlocked: false,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser('test-id');

      expect(result).toEqual(expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
      }));
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.validateUser('test-id')).rejects.toThrow('User not found');
    });
  });

  describe('validateCredentials', () => {
    it('should validate credentials and return user', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'test-id',
        email: credentials.email,
        passwordHash: await bcrypt.hash(credentials.password, 12),
        isBlocked: false,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateCredentials(credentials.email, credentials.password);

      expect(result).toEqual(expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
      }));
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw error for invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      const mockUser = {
        id: 'test-id',
        email: credentials.email,
        passwordHash: await bcrypt.hash('correct-password', 12),
        isBlocked: false,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.validateCredentials(credentials.email, credentials.password))
        .rejects.toThrow('Invalid credentials');
    });
  });
}); 