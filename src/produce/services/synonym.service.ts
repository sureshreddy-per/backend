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
        where: { is_active: true },
      });

      synonyms.forEach((synonym) => {
        // Cache canonical name to synonyms mapping
        const existingSynonyms = this.synonymCache.get(synonym.canonical_name.toLowerCase()) || [];
        existingSynonyms.push(synonym.synonym.toLowerCase());
        this.synonymCache.set(synonym.canonical_name.toLowerCase(), existingSynonyms);

        // Cache synonym to canonical name mapping
        this.canonicalCache.set(synonym.synonym.toLowerCase(), synonym.canonical_name);

        // If the language is specified, create language-specific mappings
        if (synonym.language) {
          const languageKey = `${synonym.synonym.toLowerCase()}:${synonym.language}`;
          this.canonicalCache.set(languageKey, synonym.canonical_name);
        }
      });

      this.logger.log(`Initialized synonym cache with ${synonyms.length} entries`);
    } catch (error) {
      this.logger.error('Failed to initialize synonym cache', error.stack);
    }
  }

  async findcanonical_name(word: string, language?: string): Promise<string> {
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
      .where('LOWER(synonym.canonical_name) = LOWER(:word)', { word: lowercaseWord })
      .orWhere('LOWER(synonym.synonym) = LOWER(:word)', { word: lowercaseWord })
      .andWhere('synonym.isActive = :isActive', { isActive: true });

    if (language) {
      query.andWhere('synonym.language = :language', { language });
    }

    const synonym = await query.getOne();

    if (synonym) {
      // Update cache
      this.canonicalCache.set(lowercaseWord, synonym.canonical_name);
      if (language) {
        this.canonicalCache.set(`${lowercaseWord}:${language}`, synonym.canonical_name);
      }
      return synonym.canonical_name;
    }

    return word;
  }

  async addSynonyms(canonical_name: string, synonyms: string[], language?: string): Promise<void> {
    try {
      const lowercaseCanonical = canonical_name.toLowerCase();
      const entities = synonyms.map(synonym => ({
        canonical_name: lowercaseCanonical,
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
      this.logger.error(`Error adding synonyms for ${canonical_name}: ${error.message}`);
      throw error;
    }
  }

  async findAllSynonyms(canonical_name: string, language?: string): Promise<string[]> {
    const lowercaseCanonical = canonical_name.toLowerCase();

    // Check cache first
    if (!language && this.synonymCache.has(lowercaseCanonical)) {
      return this.synonymCache.get(lowercaseCanonical);
    }

    // Query database
    const query = this.synonymRepository
      .createQueryBuilder('synonym')
      .where('LOWER(synonym.canonical_name) = LOWER(:canonical_name)', { canonical_name: lowercaseCanonical })
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

  async deactivateSynonym(canonical_name: string, synonym: string): Promise<void> {
    const lowercaseCanonical = canonical_name.toLowerCase();
    const lowercaseSynonym = synonym.toLowerCase();

    await this.synonymRepository.update(
      {
        canonical_name: lowercaseCanonical,
        synonym: lowercaseSynonym,
      },
      { is_active: false }
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
    this.synonymCache.forEach((synonyms, canonical_name) => {
      if (
        canonical_name.includes(lowercaseQuery) ||
        synonyms.some(synonym => synonym.includes(lowercaseQuery))
      ) {
        results.add(canonical_name);
      }
    });

    // If no results in cache or language filter is applied, check database
    if (results.size === 0 || language) {
      const queryBuilder = this.synonymRepository
        .createQueryBuilder('synonym')
        .where('synonym.isActive = :isActive', { isActive: true })
        .andWhere(
          '(LOWER(synonym.canonical_name) LIKE :query OR LOWER(synonym.synonym) LIKE :query)',
          { query: `%${lowercaseQuery}%` }
        );

      if (language) {
        queryBuilder.andWhere('synonym.language = :language', { language });
      }

      const dbSynonyms = await queryBuilder.getMany();
      dbSynonyms.forEach(synonym => {
        results.add(synonym.canonical_name);
      });
    }

    return Array.from(results);
  }
}
