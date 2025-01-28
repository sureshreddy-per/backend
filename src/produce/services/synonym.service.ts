import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Synonym } from '../entities/synonym.entity';
import { LanguageService } from '../../config/language.service';
import { ProduceMaster } from '../entities/produce-master.entity';

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

interface MatchScore {
  score: number;
  matchType: string;
  originalTerm: string;
  matchedTerm: string;
}

@Injectable()
export class ProduceSynonymService {
  private readonly logger = new Logger(ProduceSynonymService.name);
  private synonymCache: Map<string, string[]> = new Map();
  private produceNameCache: Map<string, string> = new Map();
  private readonly SIMILARITY_THRESHOLD = 0.8; // Configurable threshold for fuzzy matching
  private readonly VALIDATION_THRESHOLD = 0.7;
  private readonly MIN_VALIDATIONS_REQUIRED = 3;
  private readonly MATCH_WEIGHTS = {
    exact: 1.0,
    phonetic: 0.9,
    token: 0.85,
    levenshtein: 0.8,
    partial: 0.75
  };

  constructor(
    @InjectRepository(Synonym)
    private readonly synonymRepository: Repository<Synonym>,
    private readonly languageService: LanguageService,
    @InjectRepository(ProduceMaster)
    private readonly produceMasterRepository: Repository<ProduceMaster>,
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

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, ' ');
  }

  private getTokens(text: string): string[] {
    return this.normalizeText(text).split(' ');
  }

  private getSoundex(str: string): string {
    const a = str.toLowerCase().split('');
    const firstLetter = a.shift();
    const codes = {
      a: '', e: '', i: '', o: '', u: '',
      b: 1, f: 1, p: 1, v: 1,
      c: 2, g: 2, j: 2, k: 2, q: 2, s: 2, x: 2, z: 2,
      d: 3, t: 3,
      l: 4,
      m: 5, n: 5,
      r: 6
    };

    const result = a
      .map(v => codes[v])
      .filter((v, i, a) => i === 0 || v !== a[i - 1]);

    return (firstLetter + result.join('')).padEnd(4, '0').slice(0, 4);
  }

  private calculateTokenBasedSimilarity(str1: string, str2: string): number {
    const tokens1 = new Set(this.getTokens(str1));
    const tokens2 = new Set(this.getTokens(str2));
    
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    
    return intersection.size / union.size;
  }

  private isPhoneticMatch(str1: string, str2: string): boolean {
    const soundex1 = this.getSoundex(str1);
    const soundex2 = this.getSoundex(str2);
    return soundex1 === soundex2;
  }

  private calculateMatchScore(term1: string, term2: string): MatchScore {
    const normalized1 = this.normalizeText(term1);
    const normalized2 = this.normalizeText(term2);

    // Exact match
    if (normalized1 === normalized2) {
      return {
        score: this.MATCH_WEIGHTS.exact,
        matchType: 'exact',
        originalTerm: term1,
        matchedTerm: term2
      };
    }

    // Phonetic match
    if (this.isPhoneticMatch(normalized1, normalized2)) {
      return {
        score: this.MATCH_WEIGHTS.phonetic,
        matchType: 'phonetic',
        originalTerm: term1,
        matchedTerm: term2
      };
    }

    // Token-based similarity
    const tokenScore = this.calculateTokenBasedSimilarity(normalized1, normalized2);
    if (tokenScore > 0.7) {
      return {
        score: tokenScore * this.MATCH_WEIGHTS.token,
        matchType: 'token',
        originalTerm: term1,
        matchedTerm: term2
      };
    }

    // Levenshtein distance similarity
    const levenshteinScore = this.calculateSimilarity(normalized1, normalized2);
    if (levenshteinScore > 0.7) {
      return {
        score: levenshteinScore * this.MATCH_WEIGHTS.levenshtein,
        matchType: 'levenshtein',
        originalTerm: term1,
        matchedTerm: term2
      };
    }

    // Partial match
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      return {
        score: this.MATCH_WEIGHTS.partial,
        matchType: 'partial',
        originalTerm: term1,
        matchedTerm: term2
      };
    }

    return {
      score: 0,
      matchType: 'none',
      originalTerm: term1,
      matchedTerm: term2
    };
  }

  private async findBestMatch(word: string, context?: SynonymContext): Promise<MatchScore> {
    const normalizedWord = this.normalizeText(word);
    let bestMatch: MatchScore = {
      score: 0,
      matchType: 'none',
      originalTerm: word,
      matchedTerm: ''
    };

    // Check cache first
    for (const [synonym, produceName] of this.produceNameCache.entries()) {
      const matchScore = this.calculateMatchScore(normalizedWord, synonym);
      
      // Apply context boost if available
      if (context && matchScore.score > 0) {
        const contextBoost = await this.calculateContextBoost(produceName, context);
        matchScore.score = Math.min(1, matchScore.score + contextBoost);
      }

      if (matchScore.score > bestMatch.score) {
        bestMatch = matchScore;
      }
    }

    // Check database if no good match found in cache
    if (bestMatch.score < 0.8) {
      const dbSynonyms = await this.synonymRepository.find({
        where: { is_active: true }
      });

      for (const dbSynonym of dbSynonyms) {
        const matchScore = this.calculateMatchScore(normalizedWord, dbSynonym.synonym);
        
        // Apply context boost if available
        if (context && matchScore.score > 0) {
          const contextBoost = await this.calculateContextBoost(dbSynonym.produce_name, context);
          matchScore.score = Math.min(1, matchScore.score + contextBoost);
        }

        if (matchScore.score > bestMatch.score) {
          bestMatch = {
            ...matchScore,
            matchedTerm: dbSynonym.produce_name
          };
        }
      }
    }

    return bestMatch;
  }

  private async calculateContextBoost(produceName: string, context: SynonymContext): Promise<number> {
    let boost = 0;
    const synonym = await this.synonymRepository.findOne({
      where: {
        produce_name: produceName,
        is_active: true
      }
    });

    if (synonym) {
      if (context.region && synonym.region === context.region) boost += 0.1;
      if (context.season && synonym.season === context.season) boost += 0.1;
      if (context.market_context && synonym.market_context === context.market_context) boost += 0.1;
    }

    return boost;
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

  async findProduceName(word: string, context?: SynonymContext): Promise<string> {
    const bestMatch = await this.findBestMatch(word, context);
    
    if (bestMatch.score >= 0.8) {
      this.logger.debug(
        `Found match for "${word}": "${bestMatch.matchedTerm}" ` +
        `(score: ${bestMatch.score}, type: ${bestMatch.matchType})`
      );
      await this.incrementUsageCount(bestMatch.matchedTerm);
      return bestMatch.matchedTerm;
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
      
      // Skip if language is not supported instead of throwing an error
      if (!this.languageService.isLanguageSupported(targetLanguage)) {
        this.logger.warn(`Skipping synonyms for language ${targetLanguage} as it is not supported`);
        return;
      }

      // Check if this produce name is a synonym of an existing produce
      const existingProduceName = await this.findExistingProduceNameFromSynonyms(lowercaseProduce);
      if (existingProduceName && existingProduceName !== lowercaseProduce) {
        this.logger.debug(`Using existing produce name "${existingProduceName}" instead of "${lowercaseProduce}"`);
        produce_name = existingProduceName;
      }

      // First, ensure the produce exists in the master table
      const masterProduce = await this.produceMasterRepository.findOne({
        where: { name: lowercaseProduce }
      });

      if (!masterProduce) {
        // Create a new master produce entry with is_active true
        await this.produceMasterRepository.save({
          name: lowercaseProduce,
          is_active: true,
          metadata: {
            auto_generated: true,
            source: 'AI_DETECTION',
            created_at: new Date()
          }
        });
        this.logger.log(`Created new master produce entry for: ${lowercaseProduce}`);
      }

      // Filter out duplicates and normalize synonyms
      const uniqueSynonyms = [...new Set(synonyms.map(s => s.toLowerCase()))];
      
      const entities = uniqueSynonyms.map(synonym => ({
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

      this.logger.debug(`Successfully added ${savedSynonyms.length} synonyms for ${produce_name}`);
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

  async findExistingProduceNameFromSynonyms(name: string): Promise<string | null> {
    try {
      // Clean and normalize the input name
      const normalizedName = name.toLowerCase().trim();
      
      this.logger.debug(`[findExistingProduceNameFromSynonyms] Searching for: ${normalizedName}`);
      
      // First check if the name itself matches any existing produce name
      const directMatch = await this.findProduceName(normalizedName);
      if (directMatch !== normalizedName) {
        this.logger.debug(`[findExistingProduceNameFromSynonyms] Found direct match: ${directMatch}`);
        return directMatch;
      }

      // Get all existing synonyms that partially match the name
      const possibleMatches = await this.searchSynonyms(normalizedName);
      this.logger.debug(`[findExistingProduceNameFromSynonyms] Found possible matches: ${JSON.stringify(possibleMatches)}`);
      
      // If we found any possible matches, check each one
      for (const matchedName of possibleMatches) {
        // Get all synonyms for this matched name
        const allSynonyms = await this.getSynonymsInAllLanguages(matchedName);
        
        // Check if the name closely matches any existing synonym
        for (const [language, synonyms] of Object.entries(allSynonyms)) {
          // Check both the base name and its variations
          const namesToCheck = [
            normalizedName,
            ...this.generateBasicVariations(normalizedName)
          ];

          this.logger.debug(`[findExistingProduceNameFromSynonyms] Checking variations: ${JSON.stringify(namesToCheck)}`);

          for (const nameVariation of namesToCheck) {
            for (const synonym of synonyms) {
              const similarity = this.calculateSimilarity(nameVariation.toLowerCase(), synonym.toLowerCase());
              this.logger.debug(`[findExistingProduceNameFromSynonyms] Comparing "${nameVariation}" with "${synonym}" - similarity: ${similarity}`);
              
              if (this.isSimilarName(nameVariation.toLowerCase(), synonym.toLowerCase())) {
                this.logger.debug(`[findExistingProduceNameFromSynonyms] Found similar match: ${matchedName}`);
                return matchedName;
              }
            }
          }
        }
      }

      this.logger.debug(`[findExistingProduceNameFromSynonyms] No match found for: ${normalizedName}`);
      return null;
    } catch (error) {
      this.logger.error(`Error checking existing synonyms: ${error.message}`);
      return null;
    }
  }

  private generateBasicVariations(name: string): string[] {
    const variations = new Set<string>();
    const words = name.split(' ');

    // Add original name
    variations.add(name);

    // If it's a multi-word name
    if (words.length > 1) {
      // Add variation without spaces
      variations.add(words.join(''));
      
      // Add variations with word order changes
      if (words.includes('rice') || words.includes('paddy')) {
        const nonRiceWords = words.filter(w => w !== 'rice' && w !== 'paddy');
        // Add rice variations
        if (words.includes('rice')) {
          variations.add(`rice ${nonRiceWords.join(' ')}`);
          variations.add(`${nonRiceWords.join(' ')} rice`);
        }
        // Add paddy variations
        if (words.includes('paddy')) {
          variations.add(`paddy ${nonRiceWords.join(' ')}`);
          variations.add(`${nonRiceWords.join(' ')} paddy`);
          // Add combined paddy rice variations
          variations.add(`paddy rice`);
          variations.add(`rice paddy`);
        }
      }
    }

    // Add common prefixes/suffixes for rice and paddy
    if (name.includes('rice') || name.includes('paddy')) {
      const baseName = name.replace(/rice|paddy/gi, '').trim();
      if (baseName) {
        variations.add(`rice ${baseName}`);
        variations.add(`${baseName} rice`);
        variations.add(`paddy ${baseName}`);
        variations.add(`${baseName} paddy`);
        variations.add(`paddy rice ${baseName}`);
        variations.add(`${baseName} paddy rice`);
      }
    }

    return Array.from(variations);
  }

  private isSimilarName(name1: string, name2: string): boolean {
    const matchScore = this.calculateMatchScore(name1, name2);
    const isRiceRelated = name1.includes('rice') || name1.includes('paddy') ||
                         name2.includes('rice') || name2.includes('paddy');
    
    return matchScore.score >= (isRiceRelated ? 0.7 : 0.8);
  }
}
