import { Injectable } from '@nestjs/common';
import { languageConfig, Language } from './language.config';

@Injectable()
export class LanguageService {
  private readonly config = languageConfig;

  getDefaultLanguage(): string {
    return this.config.defaultLanguage;
  }

  getSupportedLanguages(): Language[] {
    return this.config.supportedLanguages;
  }

  getActiveLanguageCodes(): string[] {
    return this.config.supportedLanguages
      .filter(lang => lang.isActive)
      .map(lang => lang.code);
  }

  getIndianLanguageCodes(): string[] {
    return this.config.supportedLanguages
      .filter(lang => lang.isActive && lang.isIndian)
      .map(lang => lang.code);
  }

  isLanguageSupported(languageCode: string): boolean {
    return this.config.supportedLanguages.some(
      lang => lang.code === languageCode && lang.isActive
    );
  }

  isIndianLanguage(languageCode: string): boolean {
    return this.config.supportedLanguages.some(
      lang => lang.code === languageCode && lang.isIndian
    );
  }

  getLanguageByCode(code: string): Language | undefined {
    return this.config.supportedLanguages.find(lang => lang.code === code);
  }

  getLanguageName(code: string): string {
    const language = this.getLanguageByCode(code);
    return language ? language.name : code;
  }

  // Helper method to get all Indian languages
  getIndianLanguages(): Language[] {
    return this.config.supportedLanguages
      .filter(lang => lang.isActive && lang.isIndian);
  }

  // Helper method to prioritize Indian languages in translations
  getPrioritizedLanguages(): Language[] {
    const indianLanguages = this.getIndianLanguages();
    const otherLanguages = this.config.supportedLanguages
      .filter(lang => lang.isActive && !lang.isIndian);
    
    return [...indianLanguages, ...otherLanguages];
  }
} 