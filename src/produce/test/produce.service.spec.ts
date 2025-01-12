import { Test, TestingModule } from '@nestjs/testing';
import { ProduceService } from '../services/produce.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Produce } from '../entities/produce.entity';
import { Repository } from 'typeorm';
import { ProduceStatus } from '../enums/produce-status.enum';
import { ProduceCategory } from '../enums/produce-category.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProduceSynonymService } from '../services/synonym.service';
import { AiSynonymService } from '../services/ai-synonym.service';
import { ConfigService } from '@nestjs/config';
import { LanguageService } from '../../config/language.service';

describe('ProduceService', () => {
  let service: ProduceService;
  let produceRepository: Repository<Produce>;
  let eventEmitter: EventEmitter2;
  let synonymService: ProduceSynonymService;

  const mockProduceRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockSynonymService = {
    findProduceName: jest.fn(),
    addSynonyms: jest.fn(),
  };

  const mockAiSynonymService = {
    generateSynonyms: jest.fn(),
  };

  const mockLanguageService = {
    getDefaultLanguage: jest.fn().mockReturnValue('en'),
    getSupportedLanguages: jest.fn().mockReturnValue(['en', 'hi', 'te']),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProduceService,
        {
          provide: getRepositoryToken(Produce),
          useValue: mockProduceRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: ProduceSynonymService,
          useValue: mockSynonymService,
        },
        {
          provide: AiSynonymService,
          useValue: mockAiSynonymService,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: LanguageService,
          useValue: mockLanguageService,
        },
      ],
    }).compile();

    service = module.get<ProduceService>(ProduceService);
    produceRepository = module.get<Repository<Produce>>(getRepositoryToken(Produce));
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    synonymService = module.get<ProduceSynonymService>(ProduceSynonymService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create produce with default name when no name is provided', async () => {
      const createProduceDto = {
        farmer_id: '550e8400-e29b-41d4-a716-446655440000',
        farm_id: '660e8400-e29b-41d4-a716-446655440000',
        images: ['http://example.com/image1.jpg'],
        produce_category: ProduceCategory.VEGETABLES,
        quantity: 100,
        unit: 'KG',
        location: '12.9716,77.5946',
      };

      const savedProduce = {
        ...createProduceDto,
        id: '770e8400-e29b-41d4-a716-446655440000',
        name: 'Unidentified Produce',
        status: ProduceStatus.PENDING_AI_ASSESSMENT,
      };

      mockProduceRepository.create.mockReturnValue(savedProduce);
      mockProduceRepository.save.mockResolvedValue(savedProduce);

      const result = await service.create(createProduceDto);

      expect(result.name).toBe('Unidentified Produce');
      expect(result.status).toBe(ProduceStatus.PENDING_AI_ASSESSMENT);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('produce.created', {
        produce_id: result.id,
        image_url: createProduceDto.images[0],
        location: createProduceDto.location,
      });
    });

    it('should handle quality assessment completion and update produce name', async () => {
      const produce = {
        id: '770e8400-e29b-41d4-a716-446655440000',
        name: 'Unidentified Produce',
        status: ProduceStatus.PENDING_AI_ASSESSMENT,
      };

      const event = {
        produce_id: produce.id,
        quality_grade: 8,
        confidence_level: 85,
        detected_name: 'Tomato',
      };

      mockProduceRepository.findOne.mockResolvedValue(produce);
      mockSynonymService.findProduceName.mockResolvedValue('Tomato');
      mockAiSynonymService.generateSynonyms.mockResolvedValue({
        synonyms: ['Tomato', 'Tamatar'],
        translations: { hi: ['टमाटर'], te: ['టమాటో'] },
      });

      await service.handleQualityAssessmentCompleted(event);

      expect(mockProduceRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: produce.id,
        name: 'Tomato',
        quality_grade: 8,
        status: ProduceStatus.AVAILABLE,
      }));
    });
  });
}); 