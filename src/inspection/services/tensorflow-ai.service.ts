import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIService, AIServiceConfig, AIAnalysisResult } from '../interfaces/ai-service.interface';
import { AIValidationService } from './ai-validation.service';
import { BatchProcessorService } from './batch-processor.service';
import { SystemMonitorService } from './system-monitor.service';
import axios from 'axios';

interface AIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageProcessingTime: number;
  averageConfidence: number;
  gpuUtilization: number;
  modelLoadTime: number;
  lastModelUpdate: Date;
}

interface AIErrorStats {
  total: number;
  byType: { [key: string]: number };
  recent: Array<{
    message: string;
    timestamp: Date;
    context?: any;
  }>;
}

@Injectable()
export class TensorFlowAIService implements AIService, OnModuleInit {
  private readonly logger = new Logger(TensorFlowAIService.name);
  private config: AIServiceConfig;
  private modelInfo: any;
  private isInitialized = false;
  private metrics: AIMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageProcessingTime: 0,
    averageConfidence: 0,
    gpuUtilization: 0,
    modelLoadTime: 0,
    lastModelUpdate: new Date(),
  };
  private errors: Array<{
    message: string;
    timestamp: Date;
    context?: any;
  }> = [];
  private errorCounts: Map<string, number> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly validationService: AIValidationService,
    private readonly batchProcessor: BatchProcessorService,
    private readonly systemMonitor: SystemMonitorService,
  ) {}

  async onModuleInit() {
    await this.initialize({
      modelEndpoint: this.configService.get<string>('AI_MODEL_ENDPOINT'),
      apiKey: this.configService.get<string>('AI_API_KEY'),
      minConfidence: this.configService.get<number>('AI_MIN_CONFIDENCE', 0.7),
      timeout: this.configService.get<number>('AI_TIMEOUT', 30000),
      retryAttempts: this.configService.get<number>('AI_RETRY_ATTEMPTS', 3),
    });
  }

  async initialize(config: AIServiceConfig): Promise<void> {
    try {
      this.config = config;
      this.modelInfo = await this.getModelInfo();
      this.isInitialized = true;
      this.logger.log(`AI service initialized with model version ${this.modelInfo.version}`);
    } catch (error) {
      this.logger.error('Failed to initialize AI service', error.stack);
      throw error;
    }
  }

  async analyzeImage(imageUrl: string, options?: {
    enhanceImage?: boolean;
    detectDefects?: boolean;
    extractFeatures?: string[];
  }): Promise<AIAnalysisResult> {
    this.ensureInitialized();
    const startTime = Date.now();

    try {
      if (!this.validationService.validateImageUrl(imageUrl)) {
        throw new Error(`Invalid image URL: ${imageUrl}`);
      }

      const imageBuffer = await this.downloadImage(imageUrl);
      if (!this.validationService.validateImageSize(imageBuffer.length)) {
        throw new Error('Image size exceeds maximum allowed size');
      }

      const processedImage = await this.preprocessImage(imageBuffer, options?.enhanceImage);
      const predictions = await this.runInference(processedImage);
      
      const features = options?.extractFeatures 
        ? await this.extractFeatures(processedImage, options.extractFeatures)
        : [];

      if (options?.detectDefects) {
        const defects = await this.detectDefects(processedImage);
        features.push(...defects);
      }

      const result: AIAnalysisResult = {
        confidence: this.calculateConfidence(predictions),
        predictions: predictions.map(p => ({
          qualityId: p.qualityId,
          probability: p.probability,
          label: p.label,
        })),
        features,
        metadata: {
          modelVersion: this.modelInfo.version,
          processingTime: Date.now() - startTime,
          deviceInfo: {
            gpu: this.isGPUAvailable(),
            modelType: 'TensorFlow',
          },
        },
      };

      const validation = this.validationService.validateAnalysisResult(result, {
        minConfidence: this.config.minConfidence,
        requiredFeatures: options?.extractFeatures,
        maxProcessingTime: this.config.timeout,
      });

      if (!validation.isValid) {
        throw new Error(`Analysis validation failed: ${validation.errors.join(', ')}`);
      }

      this.trackRequest(startTime, true, result.confidence);
      return result;
    } catch (error) {
      this.trackRequest(startTime, false);
      this.trackError(error, { imageUrl, options });
      throw error;
    }
  }

  async analyzeBatch(imageUrls: string[], options: {
    enhanceImage?: boolean;
    detectDefects?: boolean;
    extractFeatures?: string[];
  }): Promise<AIAnalysisResult[]> {
    this.ensureInitialized();
    const startTime = Date.now();

    try {
      const { results, failed, stats } = await this.batchProcessor.processWithChunking(
        imageUrls,
        async (chunk) => {
          const processedImages = await Promise.all(
            chunk.map(url => this.downloadImage(url)
              .then(buffer => this.preprocessImage(buffer, options.enhanceImage))
            )
          );

          const predictions = await Promise.all(
            processedImages.map(image => this.runInference(image))
          );

          const features = options.extractFeatures
            ? await Promise.all(processedImages.map(image => 
                this.extractFeatures(image, options.extractFeatures)
              ))
            : [];

          const defects = options.detectDefects
            ? await Promise.all(processedImages.map(image => this.detectDefects(image)))
            : [];

          return predictions.map((prediction, i) => ({
            predictions: prediction,
            confidence: this.calculateConfidence(prediction),
            features: features[i] || [],
            defects: defects[i] || [],
            metadata: {
              processingTime: Date.now() - startTime,
              modelVersion: this.modelInfo.version,
              enhancementApplied: options.enhanceImage || false,
            },
          }));
        },
        {
          concurrency: 3,
          maxBatchSize: 5,
          retryAttempts: 3,
          retryDelay: 1000,
          exponentialBackoff: true,
          maxRetryDelay: 10000,
          circuitBreaker: {
            failureThreshold: 5,
            resetTimeout: 30000,
          },
        }
      );

      this.logger.log(`
        Batch processing completed:
        Success rate: ${(stats.successCount / stats.totalProcessed) * 100}%
        Average processing time: ${stats.averageTime}ms per item
        Failed items: ${failed.length}
      `);

      if (failed.length > 0) {
        this.logger.warn(`Failed to process ${failed.length} images`);
      }

      return results;
    } catch (error) {
      this.logger.error('Batch processing failed:', error.stack);
      throw error;
    }
  }

  validateResults(results: AIAnalysisResult): boolean {
    return this.validationService.validateAnalysisResult(results, {
      minConfidence: this.config.minConfidence,
      minPredictions: 1,
    }).isValid;
  }

  async getModelInfo(): Promise<{
    version: string;
    lastUpdated: Date;
    supportedFeatures: string[];
    accuracy: number;
  }> {
    try {
      // In a real implementation, this would fetch from the model server
      return {
        version: '1.0.0',
        lastUpdated: new Date(),
        supportedFeatures: [
          'quality_grading',
          'defect_detection',
          'color_analysis',
          'size_measurement',
          'texture_analysis',
        ],
        accuracy: 0.95,
      };
    } catch (error) {
      this.logger.error('Failed to get model info', error.stack);
      throw error;
    }
  }

  private async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: this.config.timeout,
      });
      return Buffer.from(response.data, 'binary');
    } catch (error) {
      throw new Error(`Failed to download image: ${error.message}`);
    }
  }

  private async preprocessImage(imageBuffer: Buffer, enhance: boolean = false): Promise<any> {
    // In a real implementation, this would:
    // 1. Convert buffer to tensor
    // 2. Resize image
    // 3. Normalize pixels
    // 4. Apply enhancements if requested
    return imageBuffer;
  }

  private async runInference(processedImage: any): Promise<Array<{
    qualityId: string;
    probability: number;
    label: string;
  }>> {
    // In a real implementation, this would:
    // 1. Run the image through the TensorFlow model
    // 2. Process the output tensor
    // 3. Convert to prediction format
    return [
      {
        qualityId: 'quality-1',
        probability: 0.95,
        label: 'Grade A',
      },
    ];
  }

  private async extractFeatures(processedImage: any, features: string[]): Promise<Array<{
    name: string;
    value: number;
    description?: string;
  }>> {
    // In a real implementation, this would extract specific features
    return features.map(feature => ({
      name: feature,
      value: Math.random(),
      description: `Extracted ${feature} feature`,
    }));
  }

  private async detectDefects(processedImage: any): Promise<Array<{
    name: string;
    value: number;
    description?: string;
  }>> {
    // In a real implementation, this would run defect detection
    return [
      {
        name: 'bruising',
        value: 0.1,
        description: 'Minor bruising detected',
      },
    ];
  }

  private calculateConfidence(predictions: Array<{ probability: number }>): number {
    return predictions.reduce((max, p) => Math.max(max, p.probability), 0);
  }

  private isGPUAvailable(): boolean {
    // In a real implementation, this would check for GPU availability
    return false;
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('AI service not initialized');
    }
  }

  getMetrics(): AIMetrics {
    return { ...this.metrics };
  }

  getStatus(): {
    isInitialized: boolean;
    modelInfo: any;
    performance: {
      successRate: number;
      averageLatency: number;
      errorRate: number;
    };
  } {
    const totalRequests = this.metrics.totalRequests || 1;
    return {
      isInitialized: this.isInitialized,
      modelInfo: this.modelInfo,
      performance: {
        successRate: this.metrics.successfulRequests / totalRequests,
        averageLatency: this.metrics.averageProcessingTime,
        errorRate: this.metrics.failedRequests / totalRequests,
      },
    };
  }

  getErrorStats(): AIErrorStats {
    return {
      total: this.metrics.failedRequests,
      byType: Object.fromEntries(this.errorCounts),
      recent: this.errors.slice(-10),
    };
  }

  getCurrentConfig(): {
    modelEndpoint: string;
    minConfidence: number;
    timeout: number;
    retryAttempts: number;
  } {
    return {
      modelEndpoint: this.config.modelEndpoint,
      minConfidence: this.config.minConfidence,
      timeout: this.config.timeout,
      retryAttempts: this.config.retryAttempts,
    };
  }

  private trackRequest(startTime: number, success: boolean, confidence?: number) {
    const processingTime = Date.now() - startTime;
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
      if (confidence) {
        this.metrics.averageConfidence = 
          (this.metrics.averageConfidence * (this.metrics.successfulRequests - 1) + confidence) / 
          this.metrics.successfulRequests;
      }
    } else {
      this.metrics.failedRequests++;
    }

    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (this.metrics.totalRequests - 1) + processingTime) / 
      this.metrics.totalRequests;

    // Update GPU utilization if available
    if (this.isGPUAvailable()) {
      this.metrics.gpuUtilization = Math.random(); // In a real implementation, get actual GPU usage
    }
  }

  private trackError(error: Error, context?: any) {
    this.errors.push({
      message: error.message,
      timestamp: new Date(),
      context,
    });

    if (this.errors.length > 100) {
      this.errors.shift();
    }

    const count = this.errorCounts.get(error.message) || 0;
    this.errorCounts.set(error.message, count + 1);

    // Log critical errors
    if (count >= 5) {
      this.logger.error(`Frequent error detected: ${error.message} (${count + 1} occurrences)`);
    }
  }
} 