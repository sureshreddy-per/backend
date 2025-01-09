import { Injectable } from '@nestjs/common';
import { OpenAIService, VisionAnalysisResult } from './openai.service';

@Injectable()
export class AIInspectionService {
  constructor(private readonly openaiService: OpenAIService) {}

  async analyzeImage(imageUrl: string): Promise<VisionAnalysisResult> {
    return this.openaiService.analyzeImage(imageUrl);
  }
} 