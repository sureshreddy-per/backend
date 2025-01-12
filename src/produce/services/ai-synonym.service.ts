import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { LanguageService } from '../../config/language.service';

@Injectable()
export class AiSynonymService {
  private readonly logger = new Logger(AiSynonymService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly languageService: LanguageService,
  ) {}

  private buildPrompt(word: string): string {
    const languages = this.languageService.getPrioritizedLanguages();
    const languageList = languages
      .map(lang => `${lang.name} (${lang.code})${lang.isIndian ? ' [Indian]' : ''}`)
      .join(', ');

    return `Generate synonyms and translations for the produce name "${word}" in JSON format.
Focus on accuracy and common usage, especially for Indian languages.
Include regional variations and common market names where applicable.

Required format:
{
  "synonyms": ["list of English synonyms and variations"],
  "translations": {
    "language_code": ["list of translations and variations in that language"]
  }
}

Supported languages: ${languageList}

For Indian languages:
- Include regional market names
- Add phonetic variations if commonly used
- Include any local dialect variations

Notes:
- Keep all text in native script (no romanization)
- Include at least 3 variations per language where possible
- Ensure high accuracy for agricultural terms`;
  }

  async generateSynonyms(word: string): Promise<{
    synonyms: string[];
    translations: { [key: string]: string[] };
  }> {
    try {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a multilingual agricultural expert specializing in produce names and their variations across different languages and regions.',
            },
            {
              role: 'user',
              content: this.buildPrompt(word),
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = JSON.parse(response.data.choices[0].message.content);
      
      // Validate the response format
      if (!result.synonyms || !Array.isArray(result.synonyms) || !result.translations) {
        throw new Error('Invalid response format from AI service');
      }

      // Log successful generation
      this.logger.log(`Generated synonyms for "${word}" in ${Object.keys(result.translations).length} languages`);
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to generate synonyms for "${word}": ${error.message}`);
      // Return minimal result in case of error
      return {
        synonyms: [word],
        translations: {},
      };
    }
  }
} 