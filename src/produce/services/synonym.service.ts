import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ArrayContains } from 'typeorm';
import { ProduceSynonym } from '../entities/synonym.entity';

@Injectable()
export class ProduceSynonymService {
  private readonly logger = new Logger(ProduceSynonymService.name);
  private synonymCache: Map<string, string[]> = new Map();
  private canonicalCache: Map<string, string> = new Map();

  constructor(
    @InjectRepository(ProduceSynonym)
    private readonly synonymRepository: Repository<ProduceSynonym>
  ) {
    this.initializeSynonymCache();
  }

  private async initializeSynonymCache(): Promise<void> {
    try {
      const synonyms = await this.synonymRepository.find({
        where: { is_active: true }
      });

      synonyms.forEach(synonym => {
        // Cache canonical name to words mapping
        this.synonymCache.set(
          synonym.canonical_name.toLowerCase(),
          synonym.words.map(word => word.toLowerCase())
        );

        // Cache word to canonical name mapping
        synonym.words.forEach(word => {
          this.canonicalCache.set(word.toLowerCase(), synonym.canonical_name);
        });

        // Cache translations
        if (synonym.translations) {
          Object.values(synonym.translations).forEach(translation => {
            this.canonicalCache.set(translation.toLowerCase(), synonym.canonical_name);
          });
        }
      });

      this.logger.log(`Initialized synonym cache with ${synonyms.length} entries`);
    } catch (error) {
      this.logger.error('Failed to initialize synonym cache', error.stack);
    }
  }

  async findCanonicalName(word: string): Promise<string | null> {
    const lowercaseWord = word.toLowerCase();
    
    // Check cache first
    if (this.canonicalCache.has(lowercaseWord)) {
      return this.canonicalCache.get(lowercaseWord);
    }

    // If not in cache, check database
    const synonym = await this.synonymRepository.findOne({
      where: [
        { canonical_name: lowercaseWord, is_active: true },
        { words: ArrayContains([lowercaseWord]), is_active: true }
      ]
    });

    if (synonym) {
      // Update cache
      this.canonicalCache.set(lowercaseWord, synonym.canonical_name);
      return synonym.canonical_name;
    }

    return null;
  }

  async addSynonyms(
    canonicalName: string,
    words: string[],
    translations?: Record<string, string>,
    updatedBy?: string
  ): Promise<ProduceSynonym> {
    const existingSynonym = await this.synonymRepository.findOne({
      where: { canonical_name: canonicalName, is_active: true }
    });

    if (existingSynonym) {
      // Update existing synonym
      const updatedWords = Array.from(new Set([...existingSynonym.words, ...words]));
      const updatedTranslations = {
        ...existingSynonym.translations,
        ...translations
      };

      const updated = await this.synonymRepository.save({
        ...existingSynonym,
        words: updatedWords,
        translations: updatedTranslations,
        updated_by: updatedBy
      });

      // Update cache
      this.updateCache(updated);
      return updated;
    }

    // Create new synonym
    const newSynonym = await this.synonymRepository.save({
      canonical_name: canonicalName,
      words,
      translations,
      is_active: true,
      updated_by: updatedBy
    });

    // Update cache
    this.updateCache(newSynonym);
    return newSynonym;
  }

  private updateCache(synonym: ProduceSynonym): void {
    // Update canonical name to words mapping
    this.synonymCache.set(
      synonym.canonical_name.toLowerCase(),
      synonym.words.map(word => word.toLowerCase())
    );

    // Update word to canonical name mapping
    synonym.words.forEach(word => {
      this.canonicalCache.set(word.toLowerCase(), synonym.canonical_name);
    });

    // Update translations in cache
    if (synonym.translations) {
      Object.values(synonym.translations).forEach(translation => {
        this.canonicalCache.set(translation.toLowerCase(), synonym.canonical_name);
      });
    }
  }

  async searchSynonyms(query: string): Promise<string[]> {
    const lowercaseQuery = query.toLowerCase();
    const results = new Set<string>();

    // Check cache first
    this.synonymCache.forEach((words, canonicalName) => {
      if (canonicalName.includes(lowercaseQuery) || 
          words.some(word => word.includes(lowercaseQuery))) {
        results.add(canonicalName);
      }
    });

    // If no results in cache, check database
    if (results.size === 0) {
      const synonyms = await this.synonymRepository.find({
        where: { is_active: true }
      });

      synonyms.forEach(synonym => {
        if (synonym.canonical_name.toLowerCase().includes(lowercaseQuery) ||
            synonym.words.some(word => word.toLowerCase().includes(lowercaseQuery)) ||
            Object.values(synonym.translations || {}).some(translation => 
              translation.toLowerCase().includes(lowercaseQuery)
            )) {
          results.add(synonym.canonical_name);
        }
      });
    }

    return Array.from(results);
  }

  async deactivateSynonym(canonicalName: string, updatedBy: string): Promise<void> {
    await this.synonymRepository.update(
      { canonical_name: canonicalName },
      { 
        is_active: false,
        updated_by: updatedBy
      }
    );

    // Remove from cache
    this.synonymCache.delete(canonicalName.toLowerCase());
    this.canonicalCache.forEach((canonical, word) => {
      if (canonical.toLowerCase() === canonicalName.toLowerCase()) {
        this.canonicalCache.delete(word);
      }
    });
  }
}