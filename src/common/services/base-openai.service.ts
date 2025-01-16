import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class BaseOpenAIService {
  protected readonly logger: Logger;
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(
    protected readonly configService: ConfigService,
    protected readonly httpService: HttpService,
    serviceName: string
  ) {
    this.logger = new Logger(serviceName);
    
    // Debug logging for environment variables
    this.logger.debug('Environment variables:', {
      nodeEnv: process.env.NODE_ENV,
      envKeys: Object.keys(process.env).filter(key => key.includes('OPENAI')),
    });
    
    this.apiKey = process.env.OPENAI_API_KEY;
    
    // Debug logging for API key
    this.logger.debug('API Key details:', {
      keyExists: !!this.apiKey,
      keyLength: this.apiKey?.length,
      keyStart: this.apiKey?.substring(0, 8),
      keyEnd: this.apiKey?.slice(-4)
    });
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
  }

  protected async makeOpenAIRequest<T>(
    model: string,
    messages: Array<{ role: string; content: any }>,
    options: {
      temperature?: number;
      max_tokens?: number;
      parseResponse?: boolean;
    } = {}
  ): Promise<T> {
    const { temperature = 0.7, max_tokens = 1000, parseResponse = true } = options;

    try {
      // Log request details
      this.logger.debug('Making OpenAI request:', {
        model,
        temperature,
        max_tokens,
        authHeaderStart: `Bearer ${this.apiKey.substring(0, 8)}...`,
      });

      const response = await this.httpService
        .post(
          this.baseUrl,
          {
            model,
            messages,
            temperature,
            max_tokens,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )
        .toPromise();

      const result = response.data.choices[0].message.content;
      return parseResponse ? JSON.parse(result) : result;
    } catch (error) {
      // Enhanced error logging
      this.logger.error('OpenAI API request failed:', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
      });
      
      if (error.response?.data?.error) {
        throw new Error(`OpenAI API Error: ${error.response.data.error.message || error.response.data.error}`);
      }
      throw error;
    }
  }
} 