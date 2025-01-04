import { Test, TestingModule } from '@nestjs/testing';
import { BenchmarkService } from '../../src/inspection/services/benchmark.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../src/logger/logger.service';
import { SystemMonitorService } from '../../src/inspection/services/system-monitor.service';
import { TensorFlowAIService } from '../../src/inspection/services/tensorflow-ai.service';
import { BatchProcessorService } from '../../src/inspection/services/batch-processor.service';

describe('BenchmarkService', () => {
  let benchmarkService: BenchmarkService;
  let module: TestingModule;
  let systemMonitorService: SystemMonitorService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        BenchmarkService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
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
        {
          provide: TensorFlowAIService,
          useValue: {
            analyzeBatch: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: BatchProcessorService,
          useValue: {
            processWithChunking: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue({}),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    benchmarkService = module.get<BenchmarkService>(BenchmarkService);
    systemMonitorService = module.get<SystemMonitorService>(SystemMonitorService);

    // Mock process.memoryUsage
    const mockMemoryUsage = {
      heapUsed: 1000000,
      heapTotal: 2000000,
      external: 500000,
      rss: 3000000,
      arrayBuffers: 100000,
    };
    jest.spyOn(process, 'memoryUsage').mockReturnValue(mockMemoryUsage);

    // Mock process.cpuUsage
    const mockCpuUsage = {
      user: 500000,
      system: 300000,
    };
    jest.spyOn(process, 'cpuUsage').mockReturnValue(mockCpuUsage);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  describe('Performance Measurement', () => {
    it('should measure execution time of an operation', async () => {
      const mockOperation = jest.fn().mockResolvedValue('test result');
      const result = await benchmarkService.measure(mockOperation);

      expect(mockOperation).toHaveBeenCalled();
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('value', 'test result');
    });

    it('should track memory usage', () => {
      const stats = benchmarkService.getMemoryUsage();
      expect(stats.heapUsed).toBe(1000000);
      expect(stats.heapTotal).toBe(2000000);
    });

    it('should measure multiple operations in parallel', async () => {
      const mockOperations = [
        jest.fn().mockResolvedValue('op1'),
        jest.fn().mockResolvedValue('op2'),
        jest.fn().mockResolvedValue('op3'),
      ];

      const results = await Promise.all(
        mockOperations.map(op => benchmarkService.measure(op))
      );

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result).toHaveProperty('duration');
        expect(result).toHaveProperty('value', `op${index + 1}`);
      });
    });

    it('should track CPU usage', () => {
      const cpuStats = benchmarkService.getCPUStats();
      expect(cpuStats.user).toBe(500000);
      expect(cpuStats.system).toBe(300000);
    });

    it('should track resource allocation', () => {
      const resources = benchmarkService.getResourceUsage();
      expect(resources.memory).toBe(1000000);
      expect(resources.cpu).toBe(0.8); // (500000 + 300000) / 1000000
    });

    it('should analyze performance over multiple iterations', async () => {
      const mockOperation = jest.fn()
        .mockResolvedValueOnce('test1')
        .mockResolvedValueOnce('test2')
        .mockResolvedValueOnce('test3');

      const analysis = await benchmarkService.analyze(mockOperation, 3);

      expect(mockOperation).toHaveBeenCalledTimes(3);
      expect(analysis.iterations).toBe(3);
      expect(analysis.averageTime).toBeGreaterThanOrEqual(0);
      expect(analysis.minTime).toBeGreaterThanOrEqual(0);
      expect(analysis.maxTime).toBeGreaterThanOrEqual(0);
    });

    it('should compare different implementations', async () => {
      const mockImpl1 = jest.fn().mockResolvedValue('impl1');
      const mockImpl2 = jest.fn().mockResolvedValue('impl2');

      const comparison = await benchmarkService.compare(
        [
          { name: 'Implementation 1', fn: mockImpl1 },
          { name: 'Implementation 2', fn: mockImpl2 }
        ],
        3
      );

      expect(comparison).toHaveLength(2);
      expect(mockImpl1).toHaveBeenCalledTimes(3);
      expect(mockImpl2).toHaveBeenCalledTimes(3);
      comparison.forEach(result => {
        expect(result.name).toBeDefined();
        expect(result.averageTime).toBeGreaterThanOrEqual(0);
        expect(result.iterations).toBe(3);
      });
    });
  });
}); 