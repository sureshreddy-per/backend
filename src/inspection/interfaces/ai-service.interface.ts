export interface AIAnalysisResult {
  confidence: number;
  predictions: {
    qualityId: string;
    probability: number;
    label: string;
  }[];
  features: {
    name: string;
    value: number;
    description?: string;
  }[];
  metadata: {
    modelVersion: string;
    processingTime: number;
    deviceInfo?: any;
  };
}

export interface AIServiceConfig {
  modelEndpoint?: string;
  apiKey?: string;
  minConfidence: number;
  timeout: number;
  retryAttempts: number;
}

export interface AIService {
  initialize(config: AIServiceConfig): Promise<void>;
  analyzeImage(imageUrl: string, options?: {
    enhanceImage?: boolean;
    detectDefects?: boolean;
    extractFeatures?: string[];
  }): Promise<AIAnalysisResult>;
  analyzeBatch(imageUrls: string[], options?: {
    enhanceImage?: boolean;
    detectDefects?: boolean;
    extractFeatures?: string[];
  }): Promise<AIAnalysisResult[]>;
  validateResults(results: AIAnalysisResult): boolean;
  getModelInfo(): Promise<{
    version: string;
    lastUpdated: Date;
    supportedFeatures: string[];
    accuracy: number;
  }>;
} 