import { Injectable } from '@nestjs/common';
import { OpenAIService, AIAnalysisResult } from './openai.service';

@Injectable()
export class AIInspectionService {
  constructor(private readonly openaiService: OpenAIService) {}

  async analyzeImage(imageUrl: string): Promise<AIAnalysisResult> {
    return this.openaiService.analyzeProduceImage(imageUrl);
  }
}