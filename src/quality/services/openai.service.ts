import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

export interface VisionAnalysisResult {
  qualityGrade: string;
  confidence: number;
  defects: string[];
  recommendations: string[];
  rawAnalysis: string;
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
}

@Injectable()
export class OpenAIService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(OpenAIService.name);

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async analyzeProduceImage(imageUrl: string): Promise<VisionAnalysisResult> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert in agricultural produce quality assessment and market analysis. Analyze images with attention to quality, market value, and seasonal factors."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this produce image and provide a comprehensive quality and market assessment. Consider:

1. Overall Quality:
   - Grade (A: Premium, B: Standard, C: Below Standard)
   - Visual appearance and freshness
   - Structural integrity
   - Color consistency
   - Size and shape uniformity

2. Defects Analysis:
   - Surface blemishes
   - Bruising or damage
   - Color abnormalities
   - Shape deformities
   - Signs of disease or pest damage

3. Storage & Handling:
   - Optimal temperature range
   - Humidity requirements
   - Light exposure recommendations
   - Ventilation needs
   - Handling precautions

4. Market Analysis:
   - Relative price positioning
   - Competitive advantages
   - Quality percentile in market
   - Current market demand
   - Price premium factors

5. Seasonal Considerations:
   - Current seasonality impact
   - Expected quality variations
   - Optimal harvest timing
   - Seasonal price adjustments

6. Additional Insights:
   - Estimated shelf life
   - Nutritional value indicators
   - Ripeness stage
   - Quality confidence level (0-1)

Format the response as a JSON object with these exact keys:
{
  "qualityGrade": string,
  "confidence": number,
  "defects": string[],
  "recommendations": string[],
  "analysis": string,
  "nutritionalValue": string,
  "estimatedShelfLife": string,
  "storageConditions": {
    "temperature": string,
    "humidity": string,
    "lighting": string
  },
  "marketComparison": {
    "relativePriceRange": string,
    "competitiveAdvantages": string[],
    "qualityPercentile": number
  },
  "seasonalFactors": {
    "seasonality": string,
    "expectedQualityVariation": string,
    "optimalHarvestPeriod": string
  },
  "priceRecommendation": {
    "suggestedPriceRange": string,
    "premiumFactors": string[],
    "marketDemand": string
  }
}`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      return {
        qualityGrade: analysis.qualityGrade,
        confidence: analysis.confidence,
        defects: analysis.defects,
        recommendations: analysis.recommendations,
        rawAnalysis: analysis.analysis,
        nutritionalValue: analysis.nutritionalValue,
        estimatedShelfLife: analysis.estimatedShelfLife,
        storageConditions: analysis.storageConditions,
        marketComparison: analysis.marketComparison,
        seasonalFactors: analysis.seasonalFactors,
        priceRecommendation: analysis.priceRecommendation,
      };
    } catch (error) {
      this.logger.error(`Error analyzing image with OpenAI: ${error.message}`, error.stack);
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }

  async validateQualityGrade(
    imageAnalysis: VisionAnalysisResult,
    previousGrade?: string,
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are a senior produce quality control expert with extensive experience in grading agricultural products.
Your task is to validate quality grades based on comprehensive analysis results, market standards, and seasonal factors.
Consider all aspects including visual quality, defects, shelf life, market positioning, and seasonal variations.`
          },
          {
            role: "user",
            content: `
Review this detailed quality assessment and validate the grade:

Analysis: ${imageAnalysis.rawAnalysis}
Suggested Grade: ${imageAnalysis.qualityGrade}
Confidence: ${imageAnalysis.confidence}
Defects: ${imageAnalysis.defects.join(', ')}
Shelf Life: ${imageAnalysis.estimatedShelfLife}
Storage Requirements: ${JSON.stringify(imageAnalysis.storageConditions)}
Market Position: ${JSON.stringify(imageAnalysis.marketComparison)}
Seasonal Factors: ${JSON.stringify(imageAnalysis.seasonalFactors)}
${previousGrade ? `Previous Grade: ${previousGrade}` : ''}

Based on all these factors, determine the final grade.
Respond with only a single letter: A, B, or C`
          }
        ],
        max_tokens: 1,
        temperature: 0.1,
      });

      const finalGrade = response.choices[0]?.message?.content?.trim() || imageAnalysis.qualityGrade;
      return finalGrade;
    } catch (error) {
      this.logger.error(`Error validating quality grade: ${error.message}`, error.stack);
      return imageAnalysis.qualityGrade;
    }
  }
} 