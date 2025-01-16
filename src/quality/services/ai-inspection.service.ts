import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { GcpStorageService } from '../../common/services/gcp-storage.service';

@Injectable()
export class AIInspectionService {
  private readonly logger = new Logger(AIInspectionService.name);

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly storageService: GcpStorageService,
  ) {}

  async analyzeImage(event: { image_url: string }): Promise<any> {
    try {
      // Download the image from GCP
      const { buffer, mimeType } = await this.storageService.downloadFile(event.image_url);
      
      // Analyze the image using OpenAI
      const analysis = await this.openaiService.analyzeProduceImage(buffer, mimeType);
      
      return analysis;
    } catch (error) {
      this.logger.error(`Error analyzing image: ${error.message}`, error.stack);
      throw error;
    }
  }
}
