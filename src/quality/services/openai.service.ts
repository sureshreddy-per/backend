import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { ProduceCategory } from '../../produce/enums/produce-category.enum';
import { firstValueFrom } from 'rxjs';
import sharp from 'sharp';
import heicConvert from 'heic-convert';
import { QualityAssessmentService } from '../services/quality-assessment.service';

export interface AIAnalysisResult {
  name: string;
  produce_category: ProduceCategory;
  product_variety: string;
  description: string;
  quality_grade: number;
  confidence_level: number;
  detected_defects: string[];
  recommendations: string[];
  category_specific_attributes: Record<string, any>;
}

export interface ImageData {
  buffer: Buffer;
  mimeType: string;
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly apiKey: string;
  private readonly orgId: string;
  private readonly apiEndpoint: string;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    protected readonly qualityAssessmentService: QualityAssessmentService,
  ) {
    // Load API key directly from environment and other configs from configuration service
    this.apiKey = process.env.OPENAI_API_KEY;
    this.orgId = this.configService.get<string>('app.openai.orgId');
    this.model = this.configService.get<string>('app.openai.model', 'gpt-4-vision-preview');
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
    this.maxTokens = this.configService.get<number>('app.openai.maxTokens', 2000);
    this.temperature = this.configService.get<number>('app.openai.temperature', 0.9);
    
    if (!this.apiKey) {
      this.logger.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    // Log configuration for debugging (safely)
    this.logger.debug('OpenAI Service Configuration:', {
      endpoint: this.apiEndpoint,
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      orgId: this.orgId,
      apiKeyExists: !!this.apiKey
    });
  }

  private async convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
    try {
      const jpegBuffer = await heicConvert({
        buffer: buffer,
        format: 'JPEG',
        quality: 0.9
      });
      return Buffer.from(jpegBuffer);
    } catch (error) {
      this.logger.error(`Error converting HEIC to JPEG: ${error.message}`);
      throw error;
    }
  }

  private async processImageBuffer(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer, mimeType: string }> {
    try {
      if (mimeType.toLowerCase().includes('heic')) {
        const jpegBuffer = await this.convertHeicToJpeg(buffer);
        return { buffer: jpegBuffer, mimeType: 'image/jpeg' };
      }

      // For other formats, ensure they're in a supported format and optimize
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // If not in a supported format, convert to JPEG
      if (!['png', 'jpeg', 'jpg', 'gif', 'webp'].includes(metadata.format?.toLowerCase())) {
        const jpegBuffer = await image.jpeg({ quality: 90 }).toBuffer();
        return { buffer: jpegBuffer, mimeType: 'image/jpeg' };
      }

      return { buffer, mimeType };
    } catch (error) {
      this.logger.error(`Error processing image: ${error.message}`);
      throw error;
    }
  }

  private cleanJsonResponse(content: string): string {
    // Remove markdown code block markers and 'json' language identifier
    return content
      .replace(/```json\n/g, '')  // Remove opening ```json
      .replace(/```\n/g, '')      // Remove opening ``` without json
      .replace(/\n```/g, '')      // Remove closing ```
      .replace(/```/g, '')        // Remove any remaining ```
      .trim();                    // Remove any extra whitespace
  }

  async analyzeProduceWithMultipleImages(images: ImageData[], produceId: string): Promise<AIAnalysisResult> {
    try {
      // Process images first
      const processedImages = await Promise.all(
        images.map(img => this.processImageBuffer(img.buffer, img.mimeType))
      );

      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      };

      const requestBody = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this produce image and provide details about its quality, category, and any defects.'
              },
              ...processedImages.map(img => ({
                type: 'image_url',
                image_url: {
                  url: `data:${img.mimeType};base64,${img.buffer.toString('base64')}`
                }
              }))
            ]
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature
      };

      this.logger.debug('OpenAI request configuration:', {
        endpoint: this.apiEndpoint,
        model: this.model,
        imageCount: processedImages.length
      });

      const response = await firstValueFrom(
        this.httpService.post(
          this.apiEndpoint,
          requestBody,
          {
            headers,
            timeout: 30000, // 30 seconds timeout
          },
        ),
      );

      this.logger.debug('Received OpenAI API response');
      const content = response.data.choices[0].message.content;
      
      // Clean and parse the response
      const cleanedContent = this.cleanJsonResponse(content);
      this.logger.debug('Cleaned content:', cleanedContent);
      
      let result;
      try {
        result = JSON.parse(cleanedContent);
      } catch (parseError) {
        this.logger.error('Failed to parse OpenAI response:', {
          originalContent: content,
          cleanedContent,
          error: parseError.message
        });
        throw new Error('Failed to parse AI analysis result');
      }

      // Validate and transform the response
      result = {
        name: result.name || 'Unknown',
        produce_category: result.produce_category || ProduceCategory.VEGETABLES,
        product_variety: result.product_variety || 'Unknown',
        description: result.description || '',
        quality_grade: Math.min(Math.max(result.quality_grade || 5, 1), 10),
        confidence_level: Math.min(Math.max(result.confidence_level || 50, 1), 100),
        detected_defects: Array.isArray(result.detected_defects) ? result.detected_defects : [],
        recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
        category_specific_attributes: result.category_specific_attributes || {},
      };

      // Store the AI assessment results
      await this.qualityAssessmentService.create({
        produce_id: produceId,
        quality_grade: result.quality_grade,
        confidence_level: result.confidence_level,
        defects: result.detected_defects,
        recommendations: result.recommendations,
        category_specific_assessment: result.category_specific_attributes,
        metadata: {
          source: 'AI_ASSESSMENT',
          ai_model_version: this.model,
          analysis_date: new Date().toISOString()
        }
      });

      return result;
    } catch (error) {
      this.logger.error(`Error analyzing produce with multiple images: ${error.message}`, error.stack);
      if (error.response) {
        this.logger.error('OpenAI API error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
      }
      throw error;
    }
  }
}
