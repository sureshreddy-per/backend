import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OpenAIService, VisionAnalysisResult } from './openai.service';

export interface ImageAnalysisResult {
  qualityGrade: string;
  confidence: number;
  defects: string[];
  recommendations: string[];
  nutritionalValue?: string;
  estimatedShelfLife?: string;
  storageConditions?: {
    temperature: string;
    humidity: string;
    lighting: string;
  };
  marketComparison?: {
    relativePriceRange: string;
    competitiveAdvantages: string[];
    qualityPercentile: number;
  };
  seasonalFactors?: {
    seasonality: string;
    expectedQualityVariation: string;
    optimalHarvestPeriod: string;
  };
  priceRecommendation?: {
    suggestedPriceRange: string;
    premiumFactors: string[];
    marketDemand: string;
  };
  rawAnalysis: string;
}

@Injectable()
export class AIInspectionService {
  private readonly logger = new Logger(AIInspectionService.name);

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async analyzeImage(imageUrl: string): Promise<ImageAnalysisResult> {
    try {
      // Use OpenAI Vision API for analysis
      const visionAnalysis = await this.openaiService.analyzeProduceImage(imageUrl);
      
      // Validate the quality grade
      const finalGrade = await this.openaiService.validateQualityGrade(visionAnalysis);

      const result: ImageAnalysisResult = {
        qualityGrade: finalGrade,
        confidence: visionAnalysis.confidence,
        defects: visionAnalysis.defects,
        recommendations: visionAnalysis.recommendations,
        nutritionalValue: visionAnalysis.nutritionalValue,
        estimatedShelfLife: visionAnalysis.estimatedShelfLife,
        storageConditions: visionAnalysis.storageConditions,
        marketComparison: visionAnalysis.marketComparison,
        seasonalFactors: visionAnalysis.seasonalFactors,
        priceRecommendation: visionAnalysis.priceRecommendation,
        rawAnalysis: visionAnalysis.rawAnalysis,
      };

      this.eventEmitter.emit('quality.analysis.completed', result);
      return result;
    } catch (error) {
      this.logger.error(`Error in AI analysis: ${error.message}`, error.stack);
      
      // Fallback to mock implementation if OpenAI fails
      this.logger.warn('Falling back to mock implementation');
      return this.mockAnalysis();
    }
  }

  private mockAnalysis(): ImageAnalysisResult {
    const qualityGrade = this.determineQualityGrade();
    const qualityPercentile = this.calculateQualityPercentile(qualityGrade);

    return {
      qualityGrade,
      confidence: Math.random() * 0.3 + 0.7,
      defects: this.identifyDefects(),
      recommendations: this.generateRecommendations(),
      nutritionalValue: 'Mock nutritional value data',
      estimatedShelfLife: '7-10 days under recommended conditions',
      storageConditions: {
        temperature: '10-15°C',
        humidity: '85-95%',
        lighting: 'Store in dark or low light conditions',
      },
      marketComparison: {
        relativePriceRange: this.generatePriceRange(qualityGrade),
        competitiveAdvantages: this.generateCompetitiveAdvantages(qualityGrade),
        qualityPercentile,
      },
      seasonalFactors: {
        seasonality: this.determineSeasonality(),
        expectedQualityVariation: this.generateQualityVariation(),
        optimalHarvestPeriod: this.determineHarvestPeriod(),
      },
      priceRecommendation: {
        suggestedPriceRange: this.calculatePriceRange(qualityGrade, qualityPercentile),
        premiumFactors: this.identifyPremiumFactors(qualityGrade),
        marketDemand: this.assessMarketDemand(),
      },
      rawAnalysis: 'Mock detailed analysis of the produce quality',
    };
  }

  private determineQualityGrade(): string {
    const grades = ['A', 'B', 'C'];
    const weights = [0.5, 0.3, 0.2];
    const random = Math.random();
    let sum = 0;
    
    for (let i = 0; i < grades.length; i++) {
      sum += weights[i];
      if (random <= sum) {
        return grades[i];
      }
    }
    
    return 'C';
  }

  private calculateQualityPercentile(grade: string): number {
    switch (grade) {
      case 'A':
        return 85 + Math.random() * 15; // 85-100
      case 'B':
        return 60 + Math.random() * 25; // 60-85
      case 'C':
        return 40 + Math.random() * 20; // 40-60
      default:
        return 50;
    }
  }

  private generatePriceRange(grade: string): string {
    switch (grade) {
      case 'A':
        return 'Premium (Top 15% of market prices)';
      case 'B':
        return 'Standard (Middle 50% of market prices)';
      case 'C':
        return 'Value (Bottom 35% of market prices)';
      default:
        return 'Standard market pricing';
    }
  }

  private generateCompetitiveAdvantages(grade: string): string[] {
    const advantages = {
      A: [
        'Superior visual appeal',
        'Extended shelf life',
        'Premium market positioning',
        'High nutritional value',
        'Consistent quality',
      ],
      B: [
        'Good value proposition',
        'Reliable quality',
        'Standard market acceptance',
        'Balanced price-quality ratio',
      ],
      C: [
        'Competitive pricing',
        'Suitable for processing',
        'Value market positioning',
      ],
    };

    const gradeAdvantages = advantages[grade as keyof typeof advantages] || advantages.B;
    const numberOfAdvantages = Math.floor(Math.random() * 2) + 2; // 2-3 advantages
    return gradeAdvantages.slice(0, numberOfAdvantages);
  }

  private determineSeasonality(): string {
    const seasons = [
      'Peak Season',
      'Early Season',
      'Late Season',
      'Off Season',
    ];
    return seasons[Math.floor(Math.random() * seasons.length)];
  }

  private generateQualityVariation(): string {
    const variations = [
      'Minimal variation expected',
      'Moderate variation due to seasonal transition',
      'Quality expected to improve with seasonal progression',
      'Quality may decline as season ends',
    ];
    return variations[Math.floor(Math.random() * variations.length)];
  }

  private determineHarvestPeriod(): string {
    const periods = [
      'Current period optimal for harvest',
      'Peak harvest period in 2-3 weeks',
      'Harvest period ending in 1-2 weeks',
      'Early harvest period, quality will improve',
    ];
    return periods[Math.floor(Math.random() * periods.length)];
  }

  private calculatePriceRange(grade: string, percentile: number): string {
    const basePrice = {
      A: '8.50-12.00',
      B: '6.00-8.50',
      C: '4.00-6.00',
    }[grade] || '6.00-8.50';

    const adjustment = percentile > 90 ? ' (Premium)' :
                      percentile > 75 ? ' (High)' :
                      percentile < 50 ? ' (Value)' : '';

    return `$${basePrice}/kg${adjustment}`;
  }

  private identifyPremiumFactors(grade: string): string[] {
    const allFactors = [
      'Exceptional visual quality',
      'Extended shelf life',
      'Optimal ripeness',
      'Size uniformity',
      'Color consistency',
      'Organic certification',
      'Sustainable practices',
      'Local sourcing',
      'Specialty variety',
    ];

    const numberOfFactors = grade === 'A' ? 3 :
                          grade === 'B' ? 2 : 1;

    const factors = new Set<string>();
    while (factors.size < numberOfFactors) {
      const randomIndex = Math.floor(Math.random() * allFactors.length);
      factors.add(allFactors[randomIndex]);
    }

    return Array.from(factors);
  }

  private assessMarketDemand(): string {
    const demands = [
      'High - Strong current market demand',
      'Moderate - Stable market demand',
      'Variable - Fluctuating demand',
      'Growing - Increasing market interest',
    ];
    return demands[Math.floor(Math.random() * demands.length)];
  }

  private identifyDefects(): string[] {
    const possibleDefects = [
      'Minor bruising',
      'Slight discoloration',
      'Size variation',
      'Shape irregularity',
      'Surface blemishes',
    ];

    const numberOfDefects = Math.floor(Math.random() * 3);
    const defects = new Set<string>();

    while (defects.size < numberOfDefects) {
      const randomIndex = Math.floor(Math.random() * possibleDefects.length);
      defects.add(possibleDefects[randomIndex]);
    }

    return Array.from(defects);
  }

  private generateRecommendations(): string[] {
    const possibleRecommendations = [
      'Store at optimal temperature between 10-15°C',
      'Handle with care to prevent bruising',
      'Ensure proper ventilation during storage',
      'Monitor humidity levels',
      'Rotate stock regularly',
    ];

    const numberOfRecommendations = Math.floor(Math.random() * 2) + 1;
    const recommendations = new Set<string>();

    while (recommendations.size < numberOfRecommendations) {
      const randomIndex = Math.floor(Math.random() * possibleRecommendations.length);
      recommendations.add(possibleRecommendations[randomIndex]);
    }

    return Array.from(recommendations);
  }
} 