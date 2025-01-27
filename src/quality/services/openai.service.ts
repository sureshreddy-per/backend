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

      const requestBody = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this agricultural produce image and provide a detailed assessment in the following JSON format:
{
  "name": "produce name",
  "produce_category": "one of [FOOD_GRAINS, OILSEEDS, FRUITS, VEGETABLES, SPICES, FIBERS, SUGARCANE, FLOWERS, MEDICINAL_PLANTS]",
  "product_variety": "specific variety name",
  "description": "detailed description",
  "quality_grade": "number between 1-10",
  "confidence_level": "number between 0-100",
  "detected_defects": ["list of defects"],
  "recommendations": ["list of recommendations"],
  "category_specific_attributes": {
    // Category-specific fields will be included based on the detected category
    // For FOOD_GRAINS:
    "variety": "string",
    "moisture_content": "number (0-100)",
    "foreign_matter": "number (0-100)",
    "protein_content": "number (0-100)",
    "wastage": "number (0-100)",
    // For OILSEEDS:
    "oil_content": "number (0-100)",
    "moisture_content": "number (0-100)",
    "foreign_matter": "number (0-100)",
    "seed_size": "string",
    "seed_color": "string",
    // For FRUITS:
    "sweetness_brix": "number (0-100)",
    "size": "string (small/medium/large)",
    "color": "string",
    "ripeness": "string (ripe/unripe)",
    // For VEGETABLES:
    "freshness_level": "string (fresh/slightly wilted)",
    "size": "string (small/medium/large)",
    "color": "string",
    "moisture_content": "number (0-100)",
    "foreign_matter": "number (0-100)",
    // For SPICES:
    "essential_oil": "number (0-100)",
    "moisture_content": "number (0-100)",
    "foreign_matter": "number (0-100)",
    "aroma_quality": "string",
    "color_intensity": "string",
    // For FIBERS:
    "fiber_length": "number (min: 0)",
    "fiber_strength": "number (min: 0)",
    "micronaire": "number (0-10)",
    "uniformity": "number (0-100)",
    "trash_content": "number (0-100)",
    // For SUGARCANE:
    "brix_value": "number (0-100)",
    "pol_reading": "number (0-100)",
    "purity": "number (0-100)",
    "fiber_content": "number (0-100)",
    "juice_quality": "string",
    // For FLOWERS:
    "freshness": "string",
    "color_intensity": "string",
    "stem_length": "number (min: 0)",
    "bud_size": "string",
    "fragrance_quality": "string",
    // For MEDICINAL_PLANTS:
    "active_compounds": "number (0-100)",
    "moisture_content": "number (0-100)",
    "foreign_matter": "number (0-100)",
    "potency": "string",
    "purity": "number (0-100)"
  }
}

Important notes:
1. Include ONLY the category-specific attributes that match the detected produce_category
2. All numeric values should be within their specified ranges
3. String enums must match exactly as specified (e.g., "fresh"/"slightly wilted" for vegetables freshness_level)
4. All required fields for the detected category must be included
5. The response must be valid JSON without any additional text or markdown`
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
        temperature: this.temperature,
        response_format: { type: "json_object" }
      };

      this.logger.debug('OpenAI request details:', {
        url: this.apiEndpoint,
        method: 'POST',
        headerKeys: Object.keys(headers),
        bodyStructure: {
          model: requestBody.model,
          messageCount: requestBody.messages.length,
          contentCount: requestBody.messages[0].content.length,
          maxTokens: requestBody.max_tokens,
          temperature: requestBody.temperature
        }
      });

      try {
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
          result.quality_grade = Math.min(Math.max(result.quality_grade, 1), 10);
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
