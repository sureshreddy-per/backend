import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Synonym } from '../entities/synonym.entity';
import { AiSynonymService } from './ai-synonym.service';
import { ProduceSynonymService } from './synonym.service';
import { LanguageService } from '../../config/language.service';

@Injectable()
export class SynonymUpdateService {
  private readonly logger = new Logger(SynonymUpdateService.name);

  constructor(
    @InjectRepository(Synonym)
    private readonly synonymRepository: Repository<Synonym>,
    private readonly aiSynonymService: AiSynonymService,
    private readonly synonymService: ProduceSynonymService,
    private readonly languageService: LanguageService,
  ) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleMonthlyUpdate() {
    try {
      this.logger.log('Starting monthly synonym update process');

      // Get all unique produce names
      const uniqueProduceNames = await this.synonymRepository
        .createQueryBuilder('synonym')
        .select('DISTINCT synonym.produce_name', 'produce_name')
        .where('synonym.is_active = :isActive', { isActive: true })
        .getRawMany()
        .then(results => results.map(r => r.produce_name));

      this.logger.log(`Found ${uniqueProduceNames.length} unique produce names to process`);

      // Process each produce name
      for (const produceName of uniqueProduceNames) {
        try {
          await this.enrichSynonymsForProduceName(produceName);
        } catch (error) {
          this.logger.error(`Error processing produce name ${produceName}: ${error.message}`);
          // Continue with next produce name
          continue;
        }
      }

      this.logger.log('Monthly synonym update process completed');
    } catch (error) {
      this.logger.error('Failed to complete monthly synonym update', error.stack);
    }
  }

  private async enrichSynonymsForProduceName(produceName: string): Promise<void> {
    try {
      // Generate new synonyms using AI
      const aiSynonyms = await this.aiSynonymService.generateSynonyms(produceName);

      // Add new English synonyms
      await this.synonymService.addSynonyms(
        produceName,
        aiSynonyms.synonyms,
        'en',
        true,
        100 // High confidence for AI-generated content
      );

      // Add translations for each supported language
      for (const [language, translations] of Object.entries(aiSynonyms.translations)) {
        if (translations && translations.length > 0) {
          await this.synonymService.addSynonyms(
            produceName,
            translations,
            language,
            true,
            100
          );
        }
      }

      // Update validation timestamp for all synonyms of this produce
      await this.synonymRepository.update(
        { produce_name: produceName, is_ai_generated: true },
        { last_validated_at: new Date() }
      );

      this.logger.log(`Successfully enriched synonyms for produce name: ${produceName}`);
    } catch (error) {
      this.logger.error(`Failed to enrich synonyms for produce name ${produceName}: ${error.message}`);
      throw error;
    }
  }

  // Get all synonyms for a produce name grouped by language
  async getSynonymsByProduceName(produceName: string): Promise<{
    [language: string]: string[];
  }> {
    const synonyms = await this.synonymRepository.find({
      where: { produce_name: produceName, is_active: true }
    });

    const result: { [language: string]: string[] } = {
      en: synonyms.filter(s => !s.language || s.language === 'en').map(s => s.synonym)
    };

    // Group by language
    for (const language of this.languageService.getActiveLanguageCodes()) {
      if (language === 'en') continue;
      result[language] = synonyms
        .filter(s => s.language === language)
        .map(s => s.synonym);
    }

    return result;
  }

  // Get statistics about synonyms
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
} 