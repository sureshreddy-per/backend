import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { BaseOpenAIService } from "../../common/services/base-openai.service";

export interface SynonymGenerationResult {
  synonyms: string[];
  translations: {
    [language: string]: string[];
  };
}

@Injectable()
export class AiSynonymService extends BaseOpenAIService {
  constructor(
    configService: ConfigService,
    httpService: HttpService,
  ) {
    super(configService, httpService, AiSynonymService.name);
  }

  async generateSynonyms(produceName: string): Promise<SynonymGenerationResult> {
    return this.makeOpenAIRequest<SynonymGenerationResult>(
      "gpt-4",
      [
        {
          role: "user",
          content: `Generate synonyms and translations for the agricultural produce name "${produceName}" in the following JSON format:
          {
            "synonyms": ["list of English synonyms and common names"],
            "translations": {
              "hi": ["list of Hindi translations and common names"],
              "te": ["list of Telugu translations and common names"],
              "ta": ["list of Tamil translations and common names"],
              "kn": ["list of Kannada translations and common names"],
              "mr": ["list of Marathi translations and common names"],
              "bn": ["list of Bengali translations and common names"],
              "gu": ["list of Gujarati translations and common names"],
              "ml": ["list of Malayalam translations and common names"],
              "pa": ["list of Punjabi translations and common names"],
              "or": ["list of Odia translations and common names"],
              "as": ["list of Assamese translations and common names"]
            }
          }
          
          Please ensure:
          1. All synonyms and translations are accurate and commonly used
          2. Include regional variations where applicable
          3. Focus on Indian languages and naming conventions
          4. Maintain consistent casing (lowercase preferred)
          5. Remove any duplicates
          6. Use the exact language codes as shown above (hi, te, ta, etc.)`,
        },
      ],
      { max_tokens: 500 }
    );
  }
} 