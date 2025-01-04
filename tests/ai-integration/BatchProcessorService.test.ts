import { Test, TestingModule } from '@nestjs/testing';
import { BatchProcessorService } from '../../src/inspection/services/batch-processor.service';
import { AIValidationService } from '../../src/inspection/services/ai-validation.service';
import { SystemMonitorService } from '../../src/inspection/services/system-monitor.service';
import { AIAnalysisResult } from '../../src/inspection/interfaces/ai-service.interface';

describe('BatchProcessorService', () => {
  let batchProcessor: BatchProcessorService;
  let validationService: AIValidationService;
  let systemMonitor: SystemMonitorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchProcessorService,
        {
          provide: AIValidationService,
          useValue: {
            validateAnalysisResult: jest.fn().mockReturnValue({ isValid: true }),
          },
        },
        {
          provide: SystemMonitorService,
          useValue: {
            getRecommendedConcurrency: jest.fn().mockReturnValue(3),
            getCurrentMetrics: jest.fn().mockReturnValue({
              cpuUsage: 0.5,
              memoryUsage: 0.6,
              loadAverage: 1.2,
            }),
          },
        },
      ],
    }).compile();

    batchProcessor = module.get<BatchProcessorService>(BatchProcessorService);
    validationService = module.get<AIValidationService>(AIValidationService);
    systemMonitor = module.get<SystemMonitorService>(SystemMonitorService);
  });

  describe('Batch Processing', () => {
    it('should process batch successfully', async () => {
      const mockAnalysisResult: AIAnalysisResult = {
        confidence: 0.95,
        predictions: [
          {
            qualityId: 'quality-1',
            probability: 0.95,
            label: 'Grade A',
          },
        ],
        features: [],
        metadata: {
          modelVersion: '1.0.0',
          processingTime: 100,
          deviceInfo: {
            gpu: false,
            modelType: 'test',
          },
        },
      };

      const result = await batchProcessor.processWithChunking(
        ['item1', 'item2', 'item3'],
        async (chunk) => chunk.map(() => mockAnalysisResult),
        {
          concurrency: 2,
          maxBatchSize: 5,
        }
      );

      expect(result.results).toBeDefined();
      expect(result.failed).toHaveLength(0);
      expect(result.stats.successCount).toBeGreaterThan(0);
    });

    it('should handle processing failures', async () => {
      const result = await batchProcessor.processWithChunking(
        ['item1'],
        async () => {
          throw new Error('Processing failed');
        },
        {
          concurrency: 1,
          maxBatchSize: 1,
        }
      );

      expect(result.failed).toHaveLength(1);
      expect(result.stats.failureCount).toBeGreaterThan(0);
    });

    it('should handle mixed success and failures', async () => {
      const mockAnalysisResult: AIAnalysisResult = {
        confidence: 0.95,
        predictions: [
          {
            qualityId: 'quality-1',
            probability: 0.95,
            label: 'Grade A',
          },
        ],
        features: [],
        metadata: {
          modelVersion: '1.0.0',
          processingTime: 100,
          deviceInfo: {
            gpu: false,
            modelType: 'test',
          },
        },
      };

      let callCount = 0;
      const result = await batchProcessor.processWithChunking(
        ['success1', 'fail', 'success2', 'fail'],
        async (chunk) => {
          return chunk.map(() => {
            callCount++;
            if (callCount % 2 === 0) {
              throw new Error('Processing failed');
            }
            return mockAnalysisResult;
          });
        },
        {
          concurrency: 2,
          maxBatchSize: 2,
        }
      );

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.failed.length).toBeGreaterThan(0);
    });

    it('should handle circuit breaker', async () => {
      let failureCount = 0;
      const result = await batchProcessor.processWithChunking(
        ['item1', 'item2', 'item3', 'item4', 'item5'],
        async () => {
          failureCount++;
          throw new Error('Processing failed');
        },
        {
          concurrency: 1,
          maxBatchSize: 1,
          circuitBreaker: {
            failureThreshold: 3,
            resetTimeout: 1000,
          },
        }
      );

      expect(result.failed.length).toBeGreaterThan(0);
      expect(result.stats.circuitBreakerTrips).toBeGreaterThan(0);
    });
  });
});
