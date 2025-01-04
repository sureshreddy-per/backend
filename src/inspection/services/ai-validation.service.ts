import { Injectable, Logger } from '@nestjs/common';
import { AIAnalysisResult } from '../interfaces/ai-service.interface';

@Injectable()
export class AIValidationService {
  private readonly logger = new Logger(AIValidationService.name);

  validateImageUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      // Check for secure URLs
      if (parsedUrl.protocol !== 'https:') {
        this.logger.warn(`Non-secure URL detected: ${url}`);
        return false;
      }
      // Check for supported image formats
      const isValidFormat = url.match(/\.(jpg|jpeg|png|webp|heic|heif)$/i) !== null;
      // Check for suspicious patterns
      const hasSuspiciousPattern = url.includes('..') || url.includes('&&') || url.includes('||');
      return isValidFormat && !hasSuspiciousPattern;
    } catch {
      return false;
    }
  }

  validateImageBatch(urls: string[]): string[] {
    const maxBatchSize = 100;
    if (urls.length > maxBatchSize) {
      throw new Error(`Batch size ${urls.length} exceeds maximum of ${maxBatchSize}`);
    }
    return urls.filter(url => !this.validateImageUrl(url));
  }

  validateImageSize(size: number, maxSize: number = 10 * 1024 * 1024): boolean {
    const minSize = 1024; // 1KB minimum
    return size >= minSize && size <= maxSize;
  }

  validateImageDimensions(width: number, height: number): boolean {
    const minDimension = 100;
    const maxDimension = 4096;
    const aspectRatio = width / height;
    const minAspectRatio = 0.5;
    const maxAspectRatio = 2.0;

    return (
      width >= minDimension &&
      width <= maxDimension &&
      height >= minDimension &&
      height <= maxDimension &&
      aspectRatio >= minAspectRatio &&
      aspectRatio <= maxAspectRatio
    );
  }

  validatePredictions(predictions: AIAnalysisResult['predictions'], minPredictions: number = 1): boolean {
    if (!predictions || predictions.length < minPredictions) {
      return false;
    }

    return predictions.every(pred => {
      const isValidProbability = pred.probability >= 0 && pred.probability <= 1;
      const hasRequiredFields = pred.qualityId && pred.label;
      const isValidLabel = pred.label.length >= 2 && pred.label.length <= 50;
      const isValidQualityId = /^[a-zA-Z0-9-_]+$/.test(pred.qualityId);
      
      return isValidProbability && hasRequiredFields && isValidLabel && isValidQualityId;
    });
  }

  validateFeatures(features: AIAnalysisResult['features'], requiredFeatures: string[] = []): boolean {
    if (!features) return false;

    const featureNames = features.map(f => f.name);
    const hasRequiredFeatures = requiredFeatures.every(required => featureNames.includes(required));
    
    return hasRequiredFeatures && features.every(feature => {
      const isValidName = feature.name.length >= 2 && feature.name.length <= 50;
      const isValidValue = typeof feature.value === 'number' && !isNaN(feature.value);
      const isValidDescription = !feature.description || 
        (feature.description.length >= 10 && feature.description.length <= 200);
      
      return isValidName && isValidValue && isValidDescription;
    });
  }

  validateConfidence(confidence: number, threshold: number): boolean {
    return (
      typeof confidence === 'number' &&
      !isNaN(confidence) &&
      confidence >= threshold &&
      confidence <= 1
    );
  }

  validateProcessingTime(time: number, maxTime: number = 30000): boolean {
    const minTime = 100; // Minimum processing time in milliseconds
    return time >= minTime && time <= maxTime;
  }

  validateMetadata(metadata: AIAnalysisResult['metadata']): boolean {
    if (!metadata) return false;

    const hasRequiredFields = !!(
      metadata.modelVersion &&
      typeof metadata.processingTime === 'number' &&
      metadata.deviceInfo
    );

    const isValidVersion = /^\d+\.\d+\.\d+$/.test(metadata.modelVersion);
    const isValidProcessingTime = this.validateProcessingTime(metadata.processingTime);
    const isValidDeviceInfo = !!(
      metadata.deviceInfo &&
      typeof metadata.deviceInfo.gpu === 'boolean' &&
      metadata.deviceInfo.modelType
    );

    return hasRequiredFields && isValidVersion && isValidProcessingTime && isValidDeviceInfo;
  }

  validateBatchSize(size: number, maxBatchSize: number = 10): boolean {
    const minBatchSize = 1;
    return size >= minBatchSize && size <= maxBatchSize;
  }

  validateAnalysisResult(result: AIAnalysisResult, options: {
    minConfidence: number;
    requiredFeatures?: string[];
    maxProcessingTime?: number;
    minPredictions?: number;
    validateDimensions?: { width: number; height: number };
  }): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate confidence
    if (!this.validateConfidence(result.confidence, options.minConfidence)) {
      errors.push(`Confidence ${result.confidence} below threshold ${options.minConfidence}`);
    } else if (result.confidence < options.minConfidence + 0.1) {
      warnings.push(`Confidence ${result.confidence} is close to threshold ${options.minConfidence}`);
    }

    // Validate predictions
    if (!this.validatePredictions(result.predictions, options.minPredictions)) {
      errors.push('Invalid predictions format or count');
    }

    // Validate features
    if (!this.validateFeatures(result.features, options.requiredFeatures)) {
      errors.push(`Missing or invalid features: ${options.requiredFeatures?.join(', ')}`);
    }

    // Validate metadata
    if (!this.validateMetadata(result.metadata)) {
      errors.push('Invalid metadata format');
    }

    // Validate processing time
    if (options.maxProcessingTime && 
        !this.validateProcessingTime(result.metadata.processingTime, options.maxProcessingTime)) {
      errors.push(`Processing time exceeded maximum allowed time of ${options.maxProcessingTime}ms`);
    }

    // Validate dimensions if provided
    if (options.validateDimensions && 
        !this.validateImageDimensions(options.validateDimensions.width, options.validateDimensions.height)) {
      errors.push('Invalid image dimensions');
    }

    // Performance warnings
    if (result.metadata.processingTime > 5000) {
      warnings.push('Processing time is higher than optimal');
    }

    if (!result.metadata.deviceInfo.gpu) {
      warnings.push('GPU acceleration not available');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
} 