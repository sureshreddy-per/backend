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
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY');
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
      this.logger.error(`OpenAI API request failed: ${error.message}`);
      throw new Error(`OpenAI API request failed: ${error.message}`);
    }
  }
} 