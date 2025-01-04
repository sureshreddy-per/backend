import { ImageValidationError, PredictionValidationError, ValidationDetails } from '../errors';

export class AIValidationService {
  private readonly urlValidationRules = {
    allowedProtocols: ['https'],
    maxLength: 2048,
    allowedDomains: ['example.com'], // Add your allowed domains
    blockedPatterns: [/malicious/, /suspicious/]
  };

  private readonly imageValidationRules = {
    minWidth: 100,
    maxWidth: 4096,
    minHeight: 100,
    maxHeight: 4096,
    allowedFormats: ['jpg', 'jpeg', 'png'],
    maxSizeBytes: 10485760 // 10MB
  };

  private readonly predictionValidationRules = {
    minConfidence: 0.6,
    requiredFields: ['confidence', 'label', 'bbox'],
    maxPredictions: 100,
    timeoutMs: 30000
  };

  async validateUrl(url: string): Promise<boolean> {
    try {
      const parsedUrl = new URL(url);

      if (!this.urlValidationRules.allowedProtocols.includes(parsedUrl.protocol.replace(':', ''))) {
        throw new Error('Only HTTPS URLs are allowed');
      }

      if (url.length > this.urlValidationRules.maxLength) {
        throw new Error('URL exceeds maximum length');
      }

      if (!this.urlValidationRules.allowedDomains.includes(parsedUrl.hostname)) {
        throw new Error('Domain not allowed');
      }

      if (this.urlValidationRules.blockedPatterns.some(pattern => pattern.test(url))) {
        throw new Error('URL contains blocked patterns');
      }

      return true;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Invalid URL');
    }
  }

  async validateImage(image: {
    width: number;
    height: number;
    format: string;
    sizeBytes: number;
  }): Promise<boolean> {
    const details: ValidationDetails = { value: image };

    if (image.width < this.imageValidationRules.minWidth || 
        image.width > this.imageValidationRules.maxWidth ||
        image.height < this.imageValidationRules.minHeight || 
        image.height > this.imageValidationRules.maxHeight) {
      details.field = 'dimensions';
      details.constraint = `width: ${this.imageValidationRules.minWidth}-${this.imageValidationRules.maxWidth}, height: ${this.imageValidationRules.minHeight}-${this.imageValidationRules.maxHeight}`;
      throw new ImageValidationError('Image dimensions too small', details);
    }

    if (!this.imageValidationRules.allowedFormats.includes(image.format.toLowerCase())) {
      details.field = 'format';
      details.constraint = this.imageValidationRules.allowedFormats.join(', ');
      throw new ImageValidationError('Unsupported image format', details);
    }

    if (image.sizeBytes > this.imageValidationRules.maxSizeBytes) {
      details.field = 'sizeBytes';
      details.constraint = `${this.imageValidationRules.maxSizeBytes}`;
      throw new ImageValidationError('Image size exceeds maximum allowed', details);
    }

    return true;
  }

  async validatePrediction(prediction: {
    confidence: number;
    label: string;
    bbox?: { x: number; y: number; width: number; height: number };
  }): Promise<boolean> {
    const details: ValidationDetails = { value: prediction };

    for (const field of this.predictionValidationRules.requiredFields) {
      if (!(field in prediction)) {
        details.field = field;
        throw new PredictionValidationError(`Missing required field: ${field}`, details);
      }
    }

    if (prediction.confidence < this.predictionValidationRules.minConfidence) {
      details.field = 'confidence';
      details.constraint = `>= ${this.predictionValidationRules.minConfidence}`;
      throw new PredictionValidationError('Confidence too low', details);
    }

    return true;
  }

  async validatePredictions(predictions: any[]): Promise<boolean> {
    if (predictions.length > this.predictionValidationRules.maxPredictions) {
      throw new PredictionValidationError('Too many predictions', {
        field: 'predictions',
        constraint: `<= ${this.predictionValidationRules.maxPredictions}`,
        value: predictions.length
      });
    }

    await Promise.all(predictions.map(p => this.validatePrediction(p)));
    return true;
  }

  async validateBatch(batch: Array<{
    url: string;
    metadata: {
      width: number;
      height: number;
      format: string;
      sizeBytes: number;
    };
  }>): Promise<boolean> {
    if (batch.length > 20) { // Example batch size limit
      throw new Error('Batch size exceeds limit');
    }

    try {
      await Promise.all(batch.map(async (item) => {
        await this.validateUrl(item.url);
        await this.validateImage(item.metadata);
      }));
      return true;
    } catch (error) {
      throw new Error('Invalid image in batch');
    }
  }
} 