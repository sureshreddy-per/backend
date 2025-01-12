import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Synonym } from '../entities/synonym.entity';
import { LanguageService } from '../../config/language.service';

@Injectable()
export class ProduceSynonymService {
  private readonly logger = new Logger(ProduceSynonymService.name);
  private synonymCache: Map<string, string[]> = new Map();
  private produceNameCache: Map<string, string> = new Map();

  constructor(
    @InjectRepository(Synonym)
    private readonly synonymRepository: Repository<Synonym>,
    private readonly languageService: LanguageService,
  ) {
    this.initializeSynonymCache();
  }

  private async initializeSynonymCache(): Promise<void> {
    try {
      const synonyms = await this.synonymRepository.find({
        where: { is_active: true },
      });

      synonyms.forEach((synonym) => {
        // Cache produce name to synonyms mapping
        const existingSynonyms = this.synonymCache.get(synonym.produce_name.toLowerCase()) || [];
        existingSynonyms.push(synonym.synonym.toLowerCase());
        this.synonymCache.set(synonym.produce_name.toLowerCase(), existingSynonyms);

        // Cache synonym to produce name mapping
        this.produceNameCache.set(synonym.synonym.toLowerCase(), synonym.produce_name);

        // If the language is specified, create language-specific mappings
        if (synonym.language) {
          const languageKey = `${synonym.synonym.toLowerCase()}:${synonym.language}`;
          this.produceNameCache.set(languageKey, synonym.produce_name);
        }
      });

      this.logger.log(`Initialized synonym cache with ${synonyms.length} entries`);
    } catch (error) {
      this.logger.error('Failed to initialize synonym cache', error.stack);
    }
  }

  async findProduceName(word: string): Promise<string> {
    const lowercaseWord = word.toLowerCase();
    const defaultLanguage = this.languageService.getDefaultLanguage();
    const supportedLanguages = this.languageService.getActiveLanguageCodes();

    // First try with default language
    const defaultLanguageKey = `${lowercaseWord}:${defaultLanguage}`;
    if (this.produceNameCache.has(defaultLanguageKey)) {
      return this.produceNameCache.get(defaultLanguageKey);
    }

    // Then try other supported languages
    for (const language of supportedLanguages) {
      if (language === defaultLanguage) continue;
      const languageKey = `${lowercaseWord}:${language}`;
      if (this.produceNameCache.has(languageKey)) {
        return this.produceNameCache.get(languageKey);
      }
    }

    // Check general cache
    if (this.produceNameCache.has(lowercaseWord)) {
      return this.produceNameCache.get(lowercaseWord);
    }

    // If not in cache, check database
    const query = this.synonymRepository
      .createQueryBuilder('synonym')
      .where('LOWER(synonym.produce_name) = LOWER(:word)', { word: lowercaseWord })
      .orWhere('LOWER(synonym.synonym) = LOWER(:word)', { word: lowercaseWord })
      .andWhere('synonym.is_active = :isActive', { isActive: true });

    // First try with default language
    query.andWhere('synonym.language = :language', { language: defaultLanguage });
    let synonym = await query.getOne();

    // If not found, try other languages
    if (!synonym) {
      for (const language of supportedLanguages) {
        if (language === defaultLanguage) continue;
        query.orWhere('synonym.language = :language', { language });
      }
      synonym = await query.getOne();
    }

    if (synonym) {
      // Update cache
      this.produceNameCache.set(lowercaseWord, synonym.produce_name);
      if (synonym.language) {
        this.produceNameCache.set(`${lowercaseWord}:${synonym.language}`, synonym.produce_name);
      }
      return synonym.produce_name;
    }

    return word;
  }

  async addSynonyms(produce_name: string, synonyms: string[], language?: string, is_ai_generated: boolean = false, confidence_score?: number): Promise<void> {
    try {
      const lowercaseProduce = produce_name.toLowerCase();
      
      // If language is not provided, use default language
      const targetLanguage = language || this.languageService.getDefaultLanguage();
      
      // Verify language is supported
      if (!this.languageService.isLanguageSupported(targetLanguage)) {
        throw new Error(`Language ${targetLanguage} is not supported`);
      }

      const entities = synonyms.map(synonym => ({
        produce_name: lowercaseProduce,
        synonym: synonym.toLowerCase(),
        language: targetLanguage,
        is_active: true,
        is_ai_generated,
        confidence_score,
        last_validated_at: is_ai_generated ? null : new Date(),
      }));

      // Save to database
      const savedSynonyms = await this.synonymRepository.save(entities);

      // Update cache
      savedSynonyms.forEach(synonym => {
        // Update produce name to synonyms mapping
        const existingSynonyms = this.synonymCache.get(lowercaseProduce) || [];
        existingSynonyms.push(synonym.synonym.toLowerCase());
        this.synonymCache.set(lowercaseProduce, existingSynonyms);

        // Update synonym to produce name mapping
        this.produceNameCache.set(synonym.synonym.toLowerCase(), lowercaseProduce);

        // Update language-specific mapping
        const languageKey = `${synonym.synonym.toLowerCase()}:${targetLanguage}`;
        this.produceNameCache.set(languageKey, lowercaseProduce);
      });
    } catch (error) {
      this.logger.error(`Error adding synonyms for ${produce_name}: ${error.message}`);
      throw error;
    }
  }

  async findAllSynonyms(produce_name: string, language?: string): Promise<string[]> {
    const lowercaseProduce = produce_name.toLowerCase();
    const targetLanguage = language || this.languageService.getDefaultLanguage();

    // Verify language is supported
    if (language && !this.languageService.isLanguageSupported(targetLanguage)) {
      throw new Error(`Language ${targetLanguage} is not supported`);
    }

    // Check cache first
    if (!language && this.synonymCache.has(lowercaseProduce)) {
      return this.synonymCache.get(lowercaseProduce);
    }

    // Query database
    const query = this.synonymRepository
      .createQueryBuilder('synonym')
      .where('LOWER(synonym.produce_name) = LOWER(:produce_name)', { produce_name: lowercaseProduce })
      .andWhere('synonym.is_active = :isActive', { isActive: true });

    if (language) {
      query.andWhere('synonym.language = :language', { language: targetLanguage });
    }

    const synonyms = await query.getMany();
    const synonymList = synonyms.map(s => s.synonym);

    // Update cache if no language filter
    if (!language) {
      this.synonymCache.set(lowercaseProduce, synonymList);
    }

    return synonymList;
  }

  async deactivateSynonym(produce_name: string, synonym: string): Promise<void> {
    const lowercaseProduce = produce_name.toLowerCase();
    const lowercaseSynonym = synonym.toLowerCase();

    await this.synonymRepository.update(
      {
        produce_name: lowercaseProduce,
        synonym: lowercaseSynonym,
      },
      { is_active: false }
    );

    // Update cache
    this.produceNameCache.delete(lowercaseSynonym);
    
    // Remove from language-specific caches
    for (const language of this.languageService.getActiveLanguageCodes()) {
      const languageKey = `${lowercaseSynonym}:${language}`;
      this.produceNameCache.delete(languageKey);
    }

    const synonyms = this.synonymCache.get(lowercaseProduce) || [];
    this.synonymCache.set(
      lowercaseProduce,
      synonyms.filter(s => s !== lowercaseSynonym)
    );
  }

  async searchSynonyms(query: string, language?: string): Promise<string[]> {
    const lowercaseQuery = query.toLowerCase();
    const targetLanguage = language || this.languageService.getDefaultLanguage();
    const results = new Set<string>();

    // Verify language is supported
    if (language && !this.languageService.isLanguageSupported(targetLanguage)) {
      throw new Error(`Language ${targetLanguage} is not supported`);
    }

    // Check cache first
    this.synonymCache.forEach((synonyms, produce_name) => {
      if (
        produce_name.includes(lowercaseQuery) ||
        synonyms.some(synonym => synonym.includes(lowercaseQuery))
      ) {
        results.add(produce_name);
      }
    });

    // If no results in cache or language filter is applied, check database
    if (results.size === 0 || language) {
      const queryBuilder = this.synonymRepository
        .createQueryBuilder('synonym')
        .where('synonym.is_active = :isActive', { isActive: true })
        .andWhere(
          '(LOWER(synonym.produce_name) LIKE :query OR LOWER(synonym.synonym) LIKE :query)',
          { query: `%${lowercaseQuery}%` }
        );

      if (language) {
        queryBuilder.andWhere('synonym.language = :language', { language: targetLanguage });
      }

      const dbSynonyms = await queryBuilder.getMany();
      dbSynonyms.forEach(synonym => {
        results.add(synonym.produce_name);
      });
    }

    return Array.from(results);
  }

  // Helper method to get synonyms in all languages for a produce name
  async getSynonymsInAllLanguages(produce_name: string): Promise<{ [language: string]: string[] }> {
    const result: { [language: string]: string[] } = {};
    const supportedLanguages = this.languageService.getActiveLanguageCodes();

    await Promise.all(
      supportedLanguages.map(async (language) => {
        result[language] = await this.findAllSynonyms(produce_name, language);
      })
    );

    return result;
  }
}
