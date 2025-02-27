import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Produce } from '../entities/produce.entity';
import { CreateProduceDto } from '../dto/create-produce.dto';
import { ProduceStatus } from '../enums/produce-status.enum';
import { OnEvent } from '@nestjs/event-emitter';
import { QualityAssessmentCompletedEvent } from '../../quality/events/quality-assessment-completed.event';
import { ProduceSynonymService } from './synonym.service';
import { AiSynonymService } from './ai-synonym.service';
import { FarmersService } from '../../farmers/farmers.service';
import { InspectionDistanceFeeService } from '../../config/services/fee-config.service';
import { InspectorsService } from '../../inspectors/inspectors.service';
import { ProduceCategory } from '../enums/produce-category.enum';

@Injectable()
export class ProduceService {
  private readonly logger = new Logger(ProduceService.name);

  constructor(
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>,
    private readonly synonymService: ProduceSynonymService,
    private readonly aiSynonymService: AiSynonymService,
    private readonly farmersService: FarmersService,
    private readonly inspectionDistanceFeeService: InspectionDistanceFeeService,
    private readonly inspectorsService: InspectorsService,
  ) {}

  private parseLocation(location: string): { lat: number; lng: number } {
    const [lat, lng] = location.split(',').map(Number);
    return { lat, lng };
  }

  private async findExistingProduceNameFromSynonyms(name: string): Promise<string | null> {
    try {
      // First check if the name itself matches any existing produce name
      const directMatch = await this.synonymService.findProduceName(name);
      if (directMatch !== name) {
        return directMatch;
      }

      // Get all existing synonyms that partially match the name
      const possibleMatches = await this.synonymService.searchSynonyms(name);
      
      // If we found any possible matches, check each one
      for (const matchedName of possibleMatches) {
        const allSynonyms = await this.synonymService.getSynonymsInAllLanguages(matchedName);
        
        // Check if the name closely matches any existing synonym
        for (const [language, synonyms] of Object.entries(allSynonyms)) {
          if (synonyms.some(synonym => 
            this.isSimilarName(name.toLowerCase(), synonym.toLowerCase())
          )) {
            return matchedName;
          }
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`Error checking existing synonyms: ${error.message}`);
      return null;
    }
  }

  private isSimilarName(name1: string, name2: string): boolean {
    // Remove special characters and extra spaces
    const cleanName1 = name1.replace(/[^a-z0-9]/g, '');
    const cleanName2 = name2.replace(/[^a-z0-9]/g, '');
    
    // Check for exact match after cleaning
    if (cleanName1 === cleanName2) return true;
    
    // Check if one is contained within the other
    if (cleanName1.includes(cleanName2) || cleanName2.includes(cleanName1)) return true;
    
    // Calculate similarity (you can adjust the threshold as needed)
    const similarity = this.calculateSimilarity(cleanName1, cleanName2);
    return similarity >= 0.8; // 80% similarity threshold
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + substitutionCost
        );
      }
    }
    return matrix[str2.length][str1.length];
  }

  @OnEvent('quality.assessment.completed')
  async handleQualityAssessmentCompleted(event: QualityAssessmentCompletedEvent) {
    try {
      const produce = await this.findOne(event.produce_id);
      
      // Update all relevant fields with AI assessment results
      produce.quality_grade = event.quality_grade;
      produce.description = event.description || produce.description;
      produce.product_variety = event.product_variety || produce.product_variety;
      produce.produce_category = event.produce_category ? ProduceCategory[event.produce_category as keyof typeof ProduceCategory] : produce.produce_category;

      // Update produce name if AI detected one
      if (event.detected_name) {
        try {
          // STEP 1: First check direct match with existing produce names
          const existingProduce = await this.produceRepository.findOne({
            where: { name: event.detected_name }
          });

          if (existingProduce) {
            this.logger.log(`Found direct name match with existing produce: "${event.detected_name}"`);
            produce.name = event.detected_name;
          } else {
            // STEP 2: Check existing names and synonyms
            const existingName = await this.findExistingProduceNameFromSynonyms(event.detected_name);
            
            if (existingName) {
              this.logger.log(`Found existing produce name "${existingName}" for detected name "${event.detected_name}"`);
              produce.name = existingName;
            } else {
              // STEP 3: Generate AI synonyms and translations
              this.logger.log(`No existing match found for "${event.detected_name}". Generating AI synonyms...`);
              const aiResult = await this.aiSynonymService.generateSynonyms(event.detected_name);
              
              // STEP 4: Check if any of the AI-generated synonyms match existing entries
              const allGeneratedTerms = [
                ...aiResult.synonyms,
                ...Object.values(aiResult.translations).flat()
              ];
              
              let matchFound = false;
              for (const term of allGeneratedTerms) {
                const matchingName = await this.findExistingProduceNameFromSynonyms(term);
                if (matchingName) {
                  this.logger.log(`Found existing produce name "${matchingName}" matching AI-generated term "${term}"`);
                  produce.name = matchingName;
                  matchFound = true;
                  break;
                }
              }

              // If no matches found, use the AI-detected name
              if (!matchFound) {
                this.logger.log(`No matches found. Using AI-detected name: "${event.detected_name}"`);
                produce.name = event.detected_name;

                // Add the new name and its synonyms to the database
                await this.synonymService.addSynonyms(
                  event.detected_name,
                  aiResult.synonyms,
                  'en',
                  true,
                  event.confidence_level
                );

                // Add translations for each supported language
                for (const [language, translations] of Object.entries(aiResult.translations)) {
                  if (translations && translations.length > 0) {
                    await this.synonymService.addSynonyms(
                      event.detected_name,
                      translations as string[],
                      language,
                      true,
                      event.confidence_level
                    );
                  }
                }
              }
            }
          }
        } catch (error) {
          this.logger.error(`Error processing AI-detected name: ${error.message}`);
          // If name processing fails, still update with AI-detected name
          produce.name = event.detected_name;
        }
      }

      // Update category-specific attributes if provided by AI
      if (event.category_specific_attributes) {
        try {
          const currentAssessment = produce.quality_assessments?.[0]?.category_specific_assessment || {};
          produce.quality_assessments = [{
            ...produce.quality_assessments?.[0],
            category_specific_assessment: {
              ...currentAssessment,
              ...event.category_specific_attributes
            }
          }];
        } catch (error) {
          this.logger.error(`Error updating category-specific attributes: ${error.message}`);
          // Don't throw - continue with other updates
        }
      }

      // Update produce status based on AI confidence and quality grade
      if (event.confidence_level < 80 || event.quality_grade < 5) {
        produce.status = ProduceStatus.PENDING_INSPECTION;
        this.logger.log(`Produce ${produce.id} marked for manual inspection due to ${
          event.confidence_level < 80 ? 'low AI confidence' : 'low quality grade'
        }`);
      } else {
        produce.status = ProduceStatus.AVAILABLE;
        this.logger.log(`Produce ${produce.id} marked as available with quality grade ${event.quality_grade}`);
      }

      // Save all updates
      await this.produceRepository.save(produce);
      this.logger.log(`Successfully updated produce ${produce.id} after quality assessment`);
    } catch (error) {
      this.logger.error(`Failed to handle quality assessment for produce ${event.produce_id}: ${error.message}`);
      // Set status to PENDING_INSPECTION instead of ASSESSMENT_FAILED when AI fails
      try {
        const produce = await this.findOne(event.produce_id);
        produce.status = ProduceStatus.PENDING_INSPECTION;
        await this.produceRepository.save(produce);
        this.logger.log(`Set produce ${produce.id} to PENDING_INSPECTION due to AI assessment failure`);
      } catch (innerError) {
        this.logger.error(`Failed to update produce status after assessment failure: ${innerError.message}`);
      }
      // Don't throw the error since we've handled it by setting status to PENDING_INSPECTION
    }
  }

  async create(createProduceDto: CreateProduceDto & { farmer_id: string }): Promise<Produce> {
    if (!createProduceDto.farmer_id) {
      throw new BadRequestException('farmer_id is required');
    }

    if (!createProduceDto.images || createProduceDto.images.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    try {
      // Verify farmer exists
      const farmer = await this.farmersService.findOne(createProduceDto.farmer_id);
      if (!farmer) {
        throw new NotFoundException(`Farmer with ID ${createProduceDto.farmer_id} not found`);
      }

      // Set initial name as "Unidentified Produce" if not provided
      if (!createProduceDto.name) {
        createProduceDto.name = 'Unidentified Produce';
      }

      // Parse produce location
      const { lat, lng } = this.parseLocation(createProduceDto.location);
      this.logger.debug(`Parsed produce location: lat=${lat}, lng=${lng}`);

      // Find nearest inspector within 100km radius
      const nearbyInspectors = await this.inspectorsService.findNearby(lat, lng);
      this.logger.debug(`Found ${nearbyInspectors.length} inspectors nearby`);
      
      let inspectionFee: number;
      if (nearbyInspectors.length > 0) {
        this.logger.debug(`Nearest inspector at ${nearbyInspectors[0].distance}km with ID ${nearbyInspectors[0].inspector.id}`);
        // Calculate fee based on distance but ensure minimum of 200
        const distanceFee = this.inspectionDistanceFeeService.getDistanceFee(nearbyInspectors[0].distance);
        inspectionFee = Math.max(distanceFee, 200);
      } else {
        // If no inspector found, use maximum fee
        const config = await this.inspectionDistanceFeeService.getActiveConfig();
        inspectionFee = config.max_distance_fee || 500; // Use default max fee if no config
      }

      // Create and save the produce
      const produce = this.produceRepository.create({
        ...createProduceDto,
        farmer_id: farmer.id, // Use the farmer ID from the profile
        status: ProduceStatus.PENDING_AI_ASSESSMENT,
        inspection_fee: inspectionFee,
      });

      return this.produceRepository.save(produce);
    } catch (error) {
      this.logger.error(`Failed to create produce: ${error.message}`);
      throw error;
    }
  }

  async findAll(filters: any = {}): Promise<Produce[]> {
    return this.produceRepository.find({
      where: filters,
      relations: ['farmer'],
    });
  }

  async findOne(id: string): Promise<Produce> {
    const produce = await this.produceRepository.findOne({
      where: { id },
      relations: ['farmer'],
    });
    if (!produce) {
      throw new NotFoundException(`Produce with ID ${id} not found`);
    }
    return produce;
  }

  async findByFarmer(farmerId: string): Promise<Produce[]> {
    return this.produceRepository.find({
      where: { farmer_id: farmerId },
      relations: ['farmer'],
    });
  }

  async findAvailableInRadius(latitude: number, longitude: number, radiusInKm: number): Promise<Produce[]> {
    // Simple distance calculation using latitude and longitude
    const produces = await this.produceRepository.find({
      where: { status: ProduceStatus.AVAILABLE },
      relations: ['farmer'],
    });

    // Filter produces within radius using Haversine formula
    return produces.filter(produce => {
      const [produceLat, produceLong] = produce.location.split(',').map(Number);
      const R = 6371; // Earth's radius in kilometers
      const dLat = this.toRad(produceLat - latitude);
      const dLon = this.toRad(produceLong - longitude);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.toRad(latitude)) * Math.cos(this.toRad(produceLat)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      return distance <= radiusInKm;
    });
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI/180);
  }

  async findAndPaginate(options: any): Promise<any> {
    const [items, total] = await this.produceRepository.findAndCount(options);
    return {
      items,
      total,
      page: options.page || 1,
      limit: options.take || 10,
      totalPages: Math.ceil(total / (options.take || 10)),
    };
  }

  async updateStatus(id: string, status: ProduceStatus): Promise<Produce> {
    const produce = await this.findOne(id);
    produce.status = status;
    return this.produceRepository.save(produce);
  }

  async assignInspector(id: string, inspector_id: string): Promise<Produce> {
    const produce = await this.findOne(id);
    produce.assigned_inspector = inspector_id;
    return this.produceRepository.save(produce);
  }

  async count(): Promise<number> {
    return this.produceRepository.count();
  }

  async countByStatus(status: ProduceStatus): Promise<number> {
    return this.produceRepository.count({ where: { status } });
  }

  async getStats() {
    const [total, available, pending] = await Promise.all([
      this.count(),
      this.countByStatus(ProduceStatus.AVAILABLE),
      this.countByStatus(ProduceStatus.PENDING_AI_ASSESSMENT),
    ]);

    return {
      total,
      available,
      pending,
      utilization_rate: total > 0 ? (available / total) * 100 : 0,
    };
  }

  async findByIds(ids: string[]): Promise<Produce[]> {
    return this.produceRepository.find({
      where: { id: In(ids) },
      relations: ['farmer'],
    });
  }

  async findNearby(latitude: number, longitude: number, radiusInKm: number): Promise<Produce[]> {
    return this.findAvailableInRadius(latitude, longitude, radiusInKm);
  }

  async findById(id: string): Promise<Produce> {
    return this.findOne(id);
  }

  async update(id: string, updateData: any): Promise<Produce> {
    const produce = await this.findOne(id);
    
    Object.assign(produce, updateData);
    return this.produceRepository.save(produce);
  }

  async deleteById(id: string): Promise<{ message: string }> {
    const produce = await this.findOne(id);
    await this.produceRepository.remove(produce);
    return { message: 'Produce deleted successfully' };
  }

  async getFarmerDetails(farmerId: string) {
    const farmer = await this.farmersService.findOne(farmerId);

    if (!farmer) {
      throw new NotFoundException(`Farmer with ID ${farmerId} not found`);
    }

    return farmer;
  }
}
