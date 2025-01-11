import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Synonym } from '../entities/synonym.entity';

@Injectable()
export class ProduceSynonymService {
  private readonly logger = new Logger(ProduceSynonymService.name);
  private synonymCache: Map<string, string[]> = new Map();
  private canonicalCache: Map<string, string> = new Map();

  constructor(
    @InjectRepository(Synonym)
    private readonly synonymRepository: Repository<Synonym>,
  ) {
    this.initializeSynonymCache();
  }

  private async initializeSynonymCache(): Promise<void> {
    try {
      const synonyms = await this.synonymRepository.find({
        where: { isActive: true },
      });

      synonyms.forEach((synonym) => {
        // Cache canonical name to synonyms mapping
        const existingSynonyms = this.synonymCache.get(synonym.canonicalName.toLowerCase()) || [];
        existingSynonyms.push(synonym.synonym.toLowerCase());
        this.synonymCache.set(synonym.canonicalName.toLowerCase(), existingSynonyms);

        // Cache synonym to canonical name mapping
        this.canonicalCache.set(synonym.synonym.toLowerCase(), synonym.canonicalName);

        // If the language is specified, create language-specific mappings
        if (synonym.language) {
          const languageKey = `${synonym.synonym.toLowerCase()}:${synonym.language}`;
          this.canonicalCache.set(languageKey, synonym.canonicalName);
        }
      });

      this.logger.log(`Initialized synonym cache with ${synonyms.length} entries`);
    } catch (error) {
      this.logger.error('Failed to initialize synonym cache', error.stack);
    }
  }

  async findCanonicalName(word: string, language?: string): Promise<string> {
    const lowercaseWord = word.toLowerCase();

    // Check language-specific cache first if language is provided
    if (language) {
      const languageKey = `${lowercaseWord}:${language}`;
      if (this.canonicalCache.has(languageKey)) {
        return this.canonicalCache.get(languageKey);
      }
    }

    // Check general cache
    if (this.canonicalCache.has(lowercaseWord)) {
      return this.canonicalCache.get(lowercaseWord);
    }

    // If not in cache, check database
    const query = this.synonymRepository
      .createQueryBuilder('synonym')
      .where('LOWER(synonym.canonicalName) = LOWER(:word)', { word: lowercaseWord })
      .orWhere('LOWER(synonym.synonym) = LOWER(:word)', { word: lowercaseWord })
      .andWhere('synonym.isActive = :isActive', { isActive: true });

    if (language) {
      query.andWhere('synonym.language = :language', { language });
    }

    const synonym = await query.getOne();

    if (synonym) {
      // Update cache
      this.canonicalCache.set(lowercaseWord, synonym.canonicalName);
      if (language) {
        this.canonicalCache.set(`${lowercaseWord}:${language}`, synonym.canonicalName);
      }
      return synonym.canonicalName;
    }

    return word;
  }

  async addSynonyms(canonicalName: string, synonyms: string[], language?: string): Promise<void> {
    try {
      const lowercaseCanonical = canonicalName.toLowerCase();
      const entities = synonyms.map(synonym => ({
        canonicalName: lowercaseCanonical,
        synonym: synonym.toLowerCase(),
        language,
        isActive: true,
      }));

      // Save to database
      const savedSynonyms = await this.synonymRepository.save(entities);

      // Update cache
      savedSynonyms.forEach(synonym => {
        // Update canonical name to synonyms mapping
        const existingSynonyms = this.synonymCache.get(lowercaseCanonical) || [];
        existingSynonyms.push(synonym.synonym.toLowerCase());
        this.synonymCache.set(lowercaseCanonical, existingSynonyms);

        // Update synonym to canonical name mapping
        this.canonicalCache.set(synonym.synonym.toLowerCase(), lowercaseCanonical);

        // If language is specified, update language-specific mapping
        if (language) {
          const languageKey = `${synonym.synonym.toLowerCase()}:${language}`;
          this.canonicalCache.set(languageKey, lowercaseCanonical);
        }
      });
    } catch (error) {
      this.logger.error(`Error adding synonyms for ${canonicalName}: ${error.message}`);
      throw error;
    }
  }

  async findAllSynonyms(canonicalName: string, language?: string): Promise<string[]> {
    const lowercaseCanonical = canonicalName.toLowerCase();

    // Check cache first
    if (!language && this.synonymCache.has(lowercaseCanonical)) {
      return this.synonymCache.get(lowercaseCanonical);
    }

    // Query database
    const query = this.synonymRepository
      .createQueryBuilder('synonym')
      .where('LOWER(synonym.canonicalName) = LOWER(:canonicalName)', { canonicalName: lowercaseCanonical })
      .andWhere('synonym.isActive = :isActive', { isActive: true });

    if (language) {
      query.andWhere('synonym.language = :language', { language });
    }

    const synonyms = await query.getMany();
    const synonymList = synonyms.map(s => s.synonym);

    // Update cache if no language filter
    if (!language) {
      this.synonymCache.set(lowercaseCanonical, synonymList);
    }

    return synonymList;
  }

  async deactivateSynonym(canonicalName: string, synonym: string): Promise<void> {
    const lowercaseCanonical = canonicalName.toLowerCase();
    const lowercaseSynonym = synonym.toLowerCase();

    await this.synonymRepository.update(
      {
        canonicalName: lowercaseCanonical,
        synonym: lowercaseSynonym,
      },
      { isActive: false }
    );

    // Update cache
    this.canonicalCache.delete(lowercaseSynonym);
    const synonyms = this.synonymCache.get(lowercaseCanonical) || [];
    this.synonymCache.set(
      lowercaseCanonical,
      synonyms.filter(s => s !== lowercaseSynonym)
    );
  }

  async searchSynonyms(query: string, language?: string): Promise<string[]> {
    const lowercaseQuery = query.toLowerCase();
    const results = new Set<string>();

    // Check cache first
    this.synonymCache.forEach((synonyms, canonicalName) => {
      if (
        canonicalName.includes(lowercaseQuery) ||
        synonyms.some(synonym => synonym.includes(lowercaseQuery))
      ) {
        results.add(canonicalName);
      }
    });

    // If no results in cache or language filter is applied, check database
    if (results.size === 0 || language) {
      const queryBuilder = this.synonymRepository
        .createQueryBuilder('synonym')
        .where('synonym.isActive = :isActive', { isActive: true })
        .andWhere(
          '(LOWER(synonym.canonicalName) LIKE :query OR LOWER(synonym.synonym) LIKE :query)',
          { query: `%${lowercaseQuery}%` }
        );

      if (language) {
        queryBuilder.andWhere('synonym.language = :language', { language });
      }

      const dbSynonyms = await queryBuilder.getMany();
      dbSynonyms.forEach(synonym => {
        results.add(synonym.canonicalName);
      });
    }

    return Array.from(results);
  }
}
