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
      // Log environment variables (safely)
      this.logger.debug('Environment configuration:', {
        OPENAI_API_KEY_EXISTS: !!process.env.OPENAI_API_KEY,
        OPENAI_API_KEY_LENGTH: process.env.OPENAI_API_KEY?.length,
        NODE_ENV: process.env.NODE_ENV,
        apiEndpoint: this.apiEndpoint,
        model: this.model,
        maxTokens: this.maxTokens,
        temperature: this.temperature,
        orgId: this.orgId
      });

      // Process images first
      const processedImages = await Promise.all(
        images.map(img => this.processImageBuffer(img.buffer, img.mimeType))
      );

      this.logger.debug('Processed images:', {
        count: processedImages.length,
        mimeTypes: processedImages.map(img => img.mimeType),
        sizes: processedImages.map(img => `${(img.buffer.length / 1024).toFixed(2)}KB`)
      });

      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(this.orgId && { 'OpenAI-Organization': this.orgId })
      };

      const prompt = `Analyze this agricultural produce image and provide a detailed assessment in the following JSON format:
{
  "name": "detected produce name",
  "produce_category": "one of: FOOD_GRAINS, OILSEEDS, FRUITS, VEGETABLES, SPICES, FIBERS, SUGARCANE, FLOWERS, MEDICINAL_PLANTS",
  "product_variety": "specific variety of the produce",
  "description": "detailed description of the produce",
  "quality_grade": "number between 0-10",
  "confidence_level": "number between 0-100",
  "detected_defects": ["list of visible defects"],
  "recommendations": ["list of recommendations"],
  "category_specific_attributes": {
    // For FOOD_GRAINS
    "moisture_content": "percentage (0-100)",
    "foreign_matter": "percentage (0-100)",
    "protein_content": "percentage (0-100)",
    "broken_grains": "percentage (0-100)",

    // For OILSEEDS
    "moisture_content": "percentage (0-100)",
    "oil_content": "percentage (0-100)",
    "foreign_matter": "percentage (0-100)",

    // For FRUITS
    "ripeness": "number (0-10)",
    "brix_content": "number (0-100)",
    "color": "string description",
    "size": "number (0-10)",

    // For VEGETABLES
    "freshness_level": "number (0-10)",
    "size": "number (0-10)",
    "color": "string description",
    "moisture_content": "percentage (0-100)",
    "foreign_matter": "percentage (0-100)",

    // For SPICES
    "moisture_content": "percentage (0-100)",
    "oil_content": "percentage (0-100)",
    "foreign_matter": "percentage (0-100)",
    "aroma": "number (0-10)",

    // For FIBERS
    "staple_length": "length in mm",
    "fiber_strength": "g/tex value",
    "trash_content": "percentage (0-100)",

    // For SUGARCANE
    "brix_content": "percentage (0-100)",
    "fiber_content": "percentage (0-100)",
    "stalk_length": "length in cm",

    // For FLOWERS
    "freshness": "number (0-10)",
    "fragrance": "number (0-10)",
    "stem_length": "length in cm",

    // For MEDICINAL_PLANTS
    "moisture_content": "percentage (0-100)",
    "essential_oil_content": "percentage (0-100)",
    "purity": "percentage (0-100)"
  }
}

Important:
1. Provide ALL required fields for the detected category
2. Use numeric values for measurements (no text descriptions for measurements)
3. Ensure confidence_level reflects your certainty in the assessment
4. Include specific defects and actionable recommendations
5. For percentage values, use numbers between 0-100
6. For quality grades, use numbers between 0-10

Analyze the image and provide the assessment:`;

      const messages = [
        {
          role: 'system',
          content: 'You are an expert agricultural produce quality assessor. Provide detailed, accurate assessments in the exact JSON format requested.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            ...processedImages.map(img => ({
              type: 'image_url',
              image_url: {
                url: `data:${img.mimeType};base64,${img.buffer.toString('base64')}`
              }
            }))
          ]
        }
      ];

      this.logger.debug('OpenAI request details:', {
        url: this.apiEndpoint,
        method: 'POST',
        headerKeys: Object.keys(headers),
        bodyStructure: {
          model: this.model,
          messageCount: messages.length,
          contentCount: messages.reduce((acc, msg) => acc + msg.content.length, 0),
          maxTokens: this.maxTokens,
          temperature: this.temperature
        }
      });

      try {
        const response = await firstValueFrom(
          this.httpService.post(
            this.apiEndpoint,
            {
              model: this.model,
              messages,
              max_tokens: this.maxTokens,
              temperature: this.temperature,
              response_format: { type: "json_object" }
            },
            {
              headers,
              timeout: 30000, // 30 seconds timeout
            },
          ),
        );

        this.logger.debug('OpenAI API response:', {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          hasChoices: !!response.data?.choices,
          choicesLength: response.data?.choices?.length,
          firstChoiceContent: response.data?.choices?.[0]?.message?.content?.substring(0, 100) + '...'
        });

        const content = response.data.choices[0].message.content;
        const cleanedContent = this.cleanJsonResponse(content);
        
        let result;
        try {
          result = JSON.parse(cleanedContent);
          
          // Validate produce category
          if (!Object.values(ProduceCategory).includes(result.produce_category)) {
            throw new Error(`Invalid produce_category: ${result.produce_category}`);
          }

          // Validate numeric ranges
          result.quality_grade = Math.min(Math.max(result.quality_grade, 0), 10);
          result.confidence_level = Math.min(Math.max(result.confidence_level, 0), 100);

          // Ensure arrays are present
          result.detected_defects = Array.isArray(result.detected_defects) ? result.detected_defects : [];
          result.recommendations = Array.isArray(result.recommendations) ? result.recommendations : [];

          this.logger.debug('Successfully parsed and validated response', {
            resultKeys: Object.keys(result),
            category: result.produce_category
          });
          
          return result;
        } catch (parseError) {
          this.logger.error('Failed to parse or validate OpenAI response:', {
            originalContent: content,
            cleanedContent,
            error: parseError.message
          });
          throw new Error('Failed to parse AI analysis result');
        }
      } catch (axiosError) {
        this.logger.error('Axios request failed:', {
          config: {
            url: axiosError.config?.url,
            method: axiosError.config?.method,
            headers: axiosError.config?.headers,
            timeout: axiosError.config?.timeout
          },
          response: axiosError.response ? {
            status: axiosError.response.status,
            statusText: axiosError.response.statusText,
            data: axiosError.response.data
          } : 'No response',
          message: axiosError.message,
          code: axiosError.code
        });
        throw axiosError;
      }
    } catch (error) {
      this.logger.error(`Error analyzing produce with multiple images:`, {
        error: error.message,
        stack: error.stack,
        produceId
      });
      throw error;
    }
  }
}
