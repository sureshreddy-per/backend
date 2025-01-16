import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { ProduceCategory } from '../../produce/enums/produce-category.enum';
import { firstValueFrom } from 'rxjs';
import sharp from 'sharp';
import heicConvert from 'heic-convert';

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
  ) {
    // Load API key directly from environment and other configs from configuration service
    this.apiKey = process.env.OPENAI_API_KEY;
    this.orgId = this.configService.get<string>('openai.orgId');
    this.model = this.configService.get<string>('openai.model');
    this.apiEndpoint = this.configService.get<string>('openai.apiEndpoint');
    this.maxTokens = this.configService.get<number>('openai.maxTokens', 2000);
    this.temperature = this.configService.get<number>('openai.temperature', 0.7);
    
    // Debug logging for API key
    this.logger.debug('Raw API Key from env:', {
      keyExists: !!process.env.OPENAI_API_KEY,
      rawLength: process.env.OPENAI_API_KEY?.length,
      rawStart: process.env.OPENAI_API_KEY?.substring(0, 8),
      rawEnd: process.env.OPENAI_API_KEY?.slice(-4),
      envKeys: Object.keys(process.env).filter(key => key.includes('OPENAI'))
    });
    
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
      apiKeyLength: this.apiKey?.length,
      apiKeyStart: this.apiKey?.substring(0, 8),
      apiKeyEnd: this.apiKey?.slice(-4)
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

  async analyzeProduceWithMultipleImages(images: ImageData[]): Promise<AIAnalysisResult> {
    try {
      this.logger.debug(`Making OpenAI API request with ${images.length} images...`);
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(this.orgId && { 'OpenAI-Organization': this.orgId }),
      };

      // Process all images to ensure they're in a supported format
      const processedImages = await Promise.all(
        images.map(async img => {
          const processed = await this.processImageBuffer(img.buffer, img.mimeType);
          return {
            type: 'image_url',
            image_url: {
              url: `data:${processed.mimeType};base64,${processed.buffer.toString('base64')}`,
            }
          };
        })
      );

      const requestBody = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze these images of the same agricultural produce from different angles and provide comprehensive details about its quality, category, and characteristics. Consider all images to make a more accurate assessment. Return ONLY a JSON object with the following structure (no markdown, no explanations): name, produce_category (from enum: VEGETABLES, FRUITS, FOOD_GRAINS, OILSEEDS, SPICES, FIBERS, SUGARCANE, FLOWERS, MEDICINAL_PLANTS), product_variety, description, quality_grade (1-10), confidence_level (1-100), detected_defects (array), recommendations (array), and category_specific_attributes (object with relevant metrics).',
              },
              ...processedImages
            ],
          },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      };

      this.logger.debug('OpenAI request configuration:', {
        endpoint: this.apiEndpoint,
        model: this.model,
        headers: { ...headers, Authorization: 'Bearer [REDACTED]' },
        imageCount: images.length,
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
      return {
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
