import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportService } from './support.service';
import { Support, SupportStatus, SupportPriority, SupportCategory } from './entities/support.entity';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { FileUploadService } from '../common/services/file-upload.service';

describe('SupportService', () => {
  let service: SupportService;
  let repository: Repository<Support>;
  let notificationsService: NotificationsService;
  let fileUploadService: FileUploadService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    })),
  };

  const mockNotificationsService = {
    create: jest.fn(),
  };

  const mockFileUploadService = {
    saveFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        {
          provide: getRepositoryToken(Support),
          useValue: mockRepository,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: FileUploadService,
          useValue: mockFileUploadService,
        },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
    repository = module.get<Repository<Support>>(getRepositoryToken(Support));
    notificationsService = module.get<NotificationsService>(NotificationsService);
    fileUploadService = module.get<FileUploadService>(FileUploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createSupportDto: CreateSupportDto = {
      title: 'Test Support',
      description: 'Test Description',
      category: SupportCategory.GENERAL,
      priority: SupportPriority.MEDIUM,
      attachments: [],
      metadata: {},
    };

    const userId = 'test-user-id';
    const userType = 'customer';

    it('should create a support ticket successfully', async () => {
      const mockSupport = {
        id: 'test-id',
        ...createSupportDto,
        customerId: userId,
        status: SupportStatus.OPEN,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockSupport);
      mockRepository.save.mockResolvedValue(mockSupport);
      mockNotificationsService.create.mockResolvedValue({});

      const result = await service.create(createSupportDto, userId, userType as 'customer' | 'buyer');

      expect(result).toEqual(mockSupport);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createSupportDto,
        customerId: userId,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockSupport);
      expect(mockNotificationsService.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated support tickets', async () => {
      const mockTickets = [
        {
          id: 'test-id-1',
          title: 'Test Support 1',
          status: SupportStatus.OPEN,
        },
        {
          id: 'test-id-2',
          title: 'Test Support 2',
          status: SupportStatus.CLOSED,
        },
      ];

      mockRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([mockTickets, 2]);

      const result = await service.findAll(1, 10);

      expect(result).toEqual({
        tickets: mockTickets,
        total: 2,
        page: 1,
        totalPages: 1,
      });
    });
  });

  describe('findOne', () => {
    it('should return a support ticket by id', async () => {
      const mockTicket = {
        id: 'test-id',
        title: 'Test Support',
        status: SupportStatus.OPEN,
      };

      mockRepository.findOne.mockResolvedValue(mockTicket);

      const result = await service.findOne('test-id');

      expect(result).toEqual(mockTicket);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        relations: ['customer', 'buyer'],
      });
    });

    it('should throw NotFoundException when ticket not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow();
    });
  });

  describe('update', () => {
    const updateSupportDto: UpdateSupportDto = {
      status: SupportStatus.IN_PROGRESS,
    };

    it('should update a support ticket successfully', async () => {
      const mockTicket = {
        id: 'test-id',
        title: 'Test Support',
        status: SupportStatus.OPEN,
        customerId: 'test-customer-id',
      };

      mockRepository.findOne.mockResolvedValue(mockTicket);
      mockRepository.save.mockResolvedValue({
        ...mockTicket,
        ...updateSupportDto,
      });
      mockNotificationsService.create.mockResolvedValue({});

      const result = await service.update('test-id', updateSupportDto);

      expect(result).toEqual({
        ...mockTicket,
        ...updateSupportDto,
      });
      expect(mockNotificationsService.create).toHaveBeenCalled();
    });
  });

  describe('attachments', () => {
    it('should add an attachment successfully', async () => {
      const mockTicket = {
        id: 'test-id',
        attachments: [],
      };

      mockRepository.findOne.mockResolvedValue(mockTicket);
      mockRepository.save.mockImplementation(ticket => ticket);

      const result = await service.addAttachment('test-id', 'test-file.pdf');

      expect(result.attachments).toContain('test-file.pdf');
    });

    it('should remove an attachment successfully', async () => {
      const mockTicket = {
        id: 'test-id',
        attachments: ['test-file.pdf'],
      };

      mockRepository.findOne.mockResolvedValue(mockTicket);
      mockRepository.save.mockImplementation(ticket => ticket);
      mockFileUploadService.deleteFile.mockResolvedValue(undefined);

      const result = await service.removeAttachment('test-id', 'test-file.pdf');

      expect(result.attachments).not.toContain('test-file.pdf');
      expect(mockFileUploadService.deleteFile).toHaveBeenCalledWith('test-file.pdf');
    });
  });
}); 