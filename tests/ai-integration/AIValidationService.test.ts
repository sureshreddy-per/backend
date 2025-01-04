import { Test, TestingModule } from '@nestjs/testing';
import { AIValidationService } from '../../src/inspection/services/ai-validation.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

describe('AIValidationService', () => {
  let validationService: AIValidationService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AIValidationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config = {
                'ai.validation.minConfidence': 0.8,
                'ai.validation.minImageWidth': 224,
                'ai.validation.minImageHeight': 224,
                'ai.validation.maxBatchSize': 10
              };
              return config[key];
            }),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    validationService = module.get<AIValidationService>(AIValidationService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('URL Validation', () => {
    it('should validate secure URLs', () => {
      expect(validationService.validateImageUrl('https://example.com/image.jpg')).toBe(true);
    });

    it('should reject non-HTTPS URLs', () => {
      expect(validationService.validateImageUrl('http://example.com/image.jpg')).toBe(false);
    });
  });

  describe('Image Validation', () => {
    it('should validate images with sufficient dimensions', () => {
      expect(validationService.validateImageDimensions(300, 300)).toBe(true);
    });

    it('should reject images with insufficient dimensions', () => {
      expect(validationService.validateImageDimensions(99, 99)).toBe(false);
    });
  });

  describe('Prediction Validation', () => {
    it('should validate predictions with high confidence', () => {
      const predictions = [{
        qualityId: 'quality1',
        probability: 0.95,
        label: 'Grade A'
      }];
      expect(validationService.validatePredictions(predictions)).toBe(true);
      expect(validationService.validateConfidence(predictions[0].probability, 0.8)).toBe(true);
    });

    it('should reject predictions with low confidence', () => {
      const predictions = [{
        qualityId: 'quality1',
        probability: 0.6,
        label: 'Grade A'
      }];
      expect(validationService.validatePredictions(predictions)).toBe(true);
      expect(validationService.validateConfidence(predictions[0].probability, 0.8)).toBe(false);
    });
  });

  describe('Batch Validation', () => {
    it('should validate batches within size limit', () => {
      const batch = Array(5).fill({ url: 'https://example.com/image.jpg' });
      expect(validationService.validateBatchSize(batch.length)).toBe(true);
    });

    it('should reject batches exceeding size limit', () => {
      const batch = Array(15).fill({ url: 'https://example.com/image.jpg' });
      expect(validationService.validateBatchSize(batch.length)).toBe(false);
    });

    it('should reject batches with any invalid URLs', () => {
      const urls = [
        'https://example.com/image1.jpg',
        'http://example.com/image2.jpg'
      ];
      const invalidUrls = validationService.validateImageBatch(urls);
      expect(invalidUrls.length).toBeGreaterThan(0);
    });
  });

  describe('Device Validation', () => {
    it('should validate GPU requirements', () => {
      const metadata = {
        modelVersion: '1.0.0',
        processingTime: 1000,
        deviceInfo: {
          gpu: true,
          modelType: 'test-model'
        }
      };
      expect(validationService.validateMetadata(metadata)).toBe(true);
    });

    it('should handle missing GPU information', () => {
      const metadata = {
        modelVersion: '1.0.0',
        processingTime: 1000,
        deviceInfo: {
          modelType: 'test-model'
        }
      };
      expect(validationService.validateMetadata(metadata)).toBe(false);
    });
  });
}); 