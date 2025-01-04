import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportService } from './support.service';
import { Support, SupportCategory, SupportPriority } from './entities/support.entity';
import { User } from '../auth/entities/user.entity';
import { CreateSupportDto } from './dto/create-support.dto';
import { NotFoundException } from '@nestjs/common';

describe('SupportService', () => {
  let service: SupportService;
  let supportRepository: Repository<Support>;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        {
          provide: getRepositoryToken(Support),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
    supportRepository = module.get<Repository<Support>>(getRepositoryToken(Support));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a support ticket', async () => {
      const userId = 'test-user-id';
      const createSupportDto: CreateSupportDto = {
        title: 'Test Support',
        description: 'Test Description',
        category: SupportCategory.GENERAL,
        priority: SupportPriority.MEDIUM,
      };

      const user = { id: userId, name: 'Test User' };
      const expectedSupport = { ...createSupportDto, userId };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);
      jest.spyOn(supportRepository, 'create').mockReturnValue(expectedSupport as Support);
      jest.spyOn(supportRepository, 'save').mockResolvedValue(expectedSupport as Support);

      const result = await service.create(userId, createSupportDto);

      expect(result).toEqual(expectedSupport);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(supportRepository.create).toHaveBeenCalledWith({
        ...createSupportDto,
        userId,
      });
      expect(supportRepository.save).toHaveBeenCalledWith(expectedSupport);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-id';
      const createSupportDto: CreateSupportDto = {
        title: 'Test Support',
        description: 'Test Description',
        category: SupportCategory.GENERAL,
        priority: SupportPriority.MEDIUM,
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.create(userId, createSupportDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a support ticket', async () => {
      const supportId = 'test-support-id';
      const expectedSupport = { id: supportId, title: 'Test Support' };

      jest.spyOn(supportRepository, 'findOne').mockResolvedValue(expectedSupport as Support);

      const result = await service.findOne(supportId);

      expect(result).toEqual(expectedSupport);
      expect(supportRepository.findOne).toHaveBeenCalledWith({
        where: { id: supportId },
        relations: ['user'],
      });
    });

    it('should throw NotFoundException if support ticket not found', async () => {
      const supportId = 'non-existent-id';

      jest.spyOn(supportRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(supportId)).rejects.toThrow(NotFoundException);
    });
  });
}); 