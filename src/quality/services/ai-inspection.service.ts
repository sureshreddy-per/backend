import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService, AIAnalysisResult, ImageData } from './openai.service';
import { GcpStorageService } from '../../common/services/gcp-storage.service';

@Injectable()
export class AIInspectionService {
  private readonly logger = new Logger(AIInspectionService.name);

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly storageService: GcpStorageService,
  ) {}

  async analyzeImage(produceId: string, imageUrl: string): Promise<AIAnalysisResult> {
    try {
      // Download the image from GCP
      const { buffer, mimeType } = await this.storageService.downloadFile(imageUrl);
      
      // Analyze the image using OpenAI
      const analysis = await this.openaiService.analyzeProduceWithMultipleImages([
        { buffer, mimeType }
      ], produceId);
      
      return analysis;
    } catch (error) {
      this.logger.error(`Error analyzing image for produce ${produceId}: ${error.message}`);
      throw error;
    }
  }
}
