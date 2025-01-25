import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Synonym } from '../entities/synonym.entity';
import { LanguageService } from '../../config/language.service';

interface SynonymMatch {
  produce_name: string;
  similarity: number;
}

interface SynonymContext {
  region?: string;
  season?: string;
  market_context?: string;
}

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  needsManualReview: boolean;
}

@Injectable()
export class ProduceSynonymService {
  private readonly logger = new Logger(ProduceSynonymService.name);
  private synonymCache: Map<string, string[]> = new Map();
  private produceNameCache: Map<string, string> = new Map();
  private readonly SIMILARITY_THRESHOLD = 0.8; // Configurable threshold for fuzzy matching
  private readonly VALIDATION_THRESHOLD = 0.7;
  private readonly MIN_VALIDATIONS_REQUIRED = 3;

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

  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j - 1] + 1, // substitution
            dp[i - 1][j] + 1,     // deletion
            dp[i][j - 1] + 1      // insertion
          );
        }
      }
    }

    return dp[m][n];
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;
    const distance = this.calculateLevenshteinDistance(str1, str2);
    return 1 - distance / maxLength;
  }

  private async findSimilarProduceNames(word: string): Promise<SynonymMatch[]> {
    const lowercaseWord = word.toLowerCase();
    const matches: SynonymMatch[] = [];

    // Check cache first
    this.produceNameCache.forEach((produceName, synonym) => {
      const similarity = this.calculateSimilarity(lowercaseWord, synonym);
      if (similarity >= this.SIMILARITY_THRESHOLD) {
        matches.push({ produce_name: produceName, similarity });
      }
    });

    // Check database for additional matches
    const allSynonyms = await this.synonymRepository.find({
      where: { is_active: true },
    });

    allSynonyms.forEach((synonym) => {
      const similarity = this.calculateSimilarity(lowercaseWord, synonym.synonym.toLowerCase());
      if (similarity >= this.SIMILARITY_THRESHOLD) {
        matches.push({ produce_name: synonym.produce_name, similarity });
      }
    });

    // Sort by similarity score in descending order
    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  private async validateSynonym(synonym: Synonym): Promise<ValidationResult> {
    const totalValidations = synonym.positive_validations + synonym.negative_validations;
    
    if (totalValidations < this.MIN_VALIDATIONS_REQUIRED) {
      return {
        isValid: true, // Assume valid until proven otherwise
        confidence: synonym.confidence_score || 0,
        needsManualReview: true
      };
    }

    const validationRatio = synonym.positive_validations / totalValidations;
    const confidence = validationRatio * (synonym.confidence_score || 1);

    return {
      isValid: validationRatio >= this.VALIDATION_THRESHOLD,
      confidence,
      needsManualReview: false
    };
  }

  async validateSynonymByUser(
    produce_name: string,
    synonym_text: string,
    isValid: boolean,
    context?: SynonymContext
  ): Promise<void> {
    const synonym = await this.synonymRepository.findOne({
      where: {
        produce_name,
        synonym: synonym_text,
        is_active: true
      }
    });

    if (!synonym) {
      throw new Error('Synonym not found');
    }

    // Update validation counts
    if (isValid) {
      synonym.positive_validations++;
    } else {
      synonym.negative_validations++;
    }
    synonym.validation_count++;
    synonym.last_validated_at = new Date();

    // Update context if provided
    if (context) {
      synonym.region = context.region || synonym.region;
      synonym.season = context.season || synonym.season;
      synonym.market_context = context.market_context || synonym.market_context;
    }

    await this.synonymRepository.save(synonym);
    await this.initializeSynonymCache(); // Refresh cache
  }

  private async findContextualMatches(
    word: string,
    context?: SynonymContext
  ): Promise<SynonymMatch[]> {
    const baseMatches = await this.findSimilarProduceNames(word);
    
    if (!context) {
      return baseMatches;
    }

    // Boost similarity scores based on context matches
    const matchesWithContext = await Promise.all(baseMatches.map(async match => {
      let contextBoost = 0;
      const synonym = await this.synonymRepository.findOne({
        where: {
          produce_name: match.produce_name,
          synonym: word,
          is_active: true
        }
      });

      if (synonym) {
        if (context.region && synonym.region === context.region) contextBoost += 0.1;
        if (context.season && synonym.season === context.season) contextBoost += 0.1;
        if (context.market_context && synonym.market_context === context.market_context) contextBoost += 0.1;
      }

      return {
        ...match,
        similarity: Math.min(1, match.similarity + contextBoost)
      };
    }));

    return matchesWithContext.sort((a, b) => b.similarity - a.similarity);
  }

  async findProduceName(
    word: string,
    context?: SynonymContext
  ): Promise<string> {
    const lowercaseWord = word.toLowerCase();
    
    // Try exact matches first (with language handling)
    const exactMatch = await this.findExactMatch(lowercaseWord);
    if (exactMatch) {
      await this.incrementUsageCount(exactMatch);
      return exactMatch;
    }

    // Try contextual fuzzy matching
    const similarMatches = await this.findContextualMatches(word, context);
    if (similarMatches.length > 0) {
      const bestMatch = similarMatches[0];
      
      // Validate the match
      const synonym = await this.synonymRepository.findOne({
        where: {
          produce_name: bestMatch.produce_name,
          is_active: true
        }
      });

      if (synonym) {
        const validation = await this.validateSynonym(synonym);
        if (validation.isValid) {
          await this.incrementUsageCount(bestMatch.produce_name);
          this.logger.log(
            `Found contextual match for "${word}": "${bestMatch.produce_name}" ` +
            `(similarity: ${bestMatch.similarity}, confidence: ${validation.confidence})`
          );
          return bestMatch.produce_name;
        }
      }
    }

    return word;
  }

  private async incrementUsageCount(produceName: string): Promise<void> {
    await this.synonymRepository.update(
      { produce_name: produceName },
      { usage_count: () => 'usage_count + 1' }
    );
  }

  private async findExactMatch(word: string): Promise<string | null> {
    const defaultLanguage = this.languageService.getDefaultLanguage();
    const supportedLanguages = this.languageService.getActiveLanguageCodes();

    // Check cache first
    const defaultLanguageKey = `${word}:${defaultLanguage}`;
    if (this.produceNameCache.has(defaultLanguageKey)) {
      return this.produceNameCache.get(defaultLanguageKey);
    }

    for (const language of supportedLanguages) {
      if (language === defaultLanguage) continue;
      const languageKey = `${word}:${language}`;
      if (this.produceNameCache.has(languageKey)) {
        return this.produceNameCache.get(languageKey);
      }
    }

    if (this.produceNameCache.has(word)) {
      return this.produceNameCache.get(word);
    }

    return null;
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

  async getSynonymStats(): Promise<{
    totalProduceNames: number;
    totalSynonyms: number;
    synonymsByLanguage: { [language: string]: number };
    aiGeneratedStats: {
      total: number;
      needsValidation: number;
      averageConfidence: number;
    };
  }> {
    const [
      totalProduceNames,
      totalSynonyms,
      synonymsByLanguage,
      aiStats
    ] = await Promise.all([
      this.synonymRepository
        .createQueryBuilder('synonym')
        .select('COUNT(DISTINCT synonym.produce_name)', 'count')
        .where('synonym.is_active = :isActive', { isActive: true })
        .getRawOne()
        .then(result => parseInt(result.count)),
      this.synonymRepository.count({ where: { is_active: true } }),
      Promise.all(
        this.languageService.getActiveLanguageCodes().map(async language => ({
          language,
          count: await this.synonymRepository.count({
            where: { language, is_active: true }
          })
        }))
      ),
      this.synonymRepository
        .createQueryBuilder('synonym')
        .select([
          'COUNT(*) as total',
          'COUNT(CASE WHEN last_validated_at IS NULL THEN 1 END) as needs_validation',
          'AVG(confidence_score) as avg_confidence'
        ])
        .where('is_ai_generated = :isAi', { isAi: true })
        .andWhere('is_active = :isActive', { isActive: true })
        .getRawOne()
    ]);

    return {
      totalProduceNames,
      totalSynonyms,
      synonymsByLanguage: Object.fromEntries(
        synonymsByLanguage.map(({ language, count }) => [language, count])
      ),
      aiGeneratedStats: {
        total: parseInt(aiStats.total),
        needsValidation: parseInt(aiStats.needs_validation),
        averageConfidence: parseFloat(aiStats.avg_confidence) || 0
      }
    };
  }

  createQueryBuilder(alias: string) {
    return this.synonymRepository.createQueryBuilder(alias);
  }
}
