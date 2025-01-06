import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produce, ProduceCategory } from './entities/produce.entity';
import { CreateProduceDto } from './dto/create-produce.dto';
import { UpdateProduceDto } from './dto/update-produce.dto';
import { ProduceFilterDto } from './dto/produce-filter.dto';
import { SortableField, SortOrder, SortConditionOperator } from './dto/produce-filter.dto';
import { Farmer } from '../farmers/entities/farmer.entity';
import { FarmDetails } from '../farmers/entities/farm-details.entity';
import { FoodGrains } from './entities/produce-categories/food-grains.entity';
import { Oilseeds } from './entities/produce-categories/oilseeds.entity';
import { Fruits } from './entities/produce-categories/fruits.entity';
import { Vegetables } from './entities/produce-categories/vegetables.entity';
import { Spices } from './entities/produce-categories/spices.entity';
import { Fibers } from './entities/produce-categories/fibers.entity';
import { Sugarcane } from './entities/produce-categories/sugarcane.entity';
import { Flowers } from './entities/produce-categories/flowers.entity';
import { MedicinalPlants } from './entities/produce-categories/medicinal-plants.entity';
import { S3Service } from '../common/services/s3.service';
import { Raw } from 'typeorm';

@Injectable()
export class ProduceService {
  constructor(
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>,
    @InjectRepository(Farmer)
    private readonly farmerRepository: Repository<Farmer>,
    @InjectRepository(FarmDetails)
    private readonly farmDetailsRepository: Repository<FarmDetails>,
    @InjectRepository(FoodGrains)
    private readonly foodGrainsRepository: Repository<FoodGrains>,
    @InjectRepository(Oilseeds)
    private readonly oilseedsRepository: Repository<Oilseeds>,
    @InjectRepository(Fruits)
    private readonly fruitsRepository: Repository<Fruits>,
    @InjectRepository(Vegetables)
    private readonly vegetablesRepository: Repository<Vegetables>,
    @InjectRepository(Spices)
    private readonly spicesRepository: Repository<Spices>,
    @InjectRepository(Fibers)
    private readonly fibersRepository: Repository<Fibers>,
    @InjectRepository(Sugarcane)
    private readonly sugarcaneRepository: Repository<Sugarcane>,
    @InjectRepository(Flowers)
    private readonly flowersRepository: Repository<Flowers>,
    @InjectRepository(MedicinalPlants)
    private readonly medicinalPlantsRepository: Repository<MedicinalPlants>,
    private readonly s3Service: S3Service,
  ) {}

  async getFarmerByUserId(userId: string): Promise<Farmer> {
    const farmer = await this.farmerRepository.findOne({
      where: { userId }
    });

    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    return farmer;
  }

  async create(farmerId: string, createProduceDto: CreateProduceDto) {
    // If farmId is provided, verify it belongs to the farmer
    if (createProduceDto.farmId) {
      const farm = await this.farmDetailsRepository.findOne({
        where: { id: createProduceDto.farmId, farmerId }
      });

      if (!farm) {
        throw new NotFoundException('Farm not found or does not belong to the farmer');
      }
    }

    // Calculate total price based on pricePerUnit and quantity
    const price = createProduceDto.price ?? (createProduceDto.pricePerUnit * createProduceDto.quantity);

    // Create the main produce entity
    const produce = this.produceRepository.create({
      ...createProduceDto,
      price,
      currency: createProduceDto.currency || 'INR',
      farmerId,
      location: {
        latitude: createProduceDto.location.latitude,
        longitude: createProduceDto.location.longitude
      }
    });

    // Save the main produce first to get the ID
    const savedProduce = await this.produceRepository.save(produce);

    // Handle category-specific details
    switch (createProduceDto.category) {
      case ProduceCategory.FOOD_GRAINS:
        if (createProduceDto.foodGrains) {
          const foodGrains = this.foodGrainsRepository.create({
            ...createProduceDto.foodGrains,
            produce: savedProduce
          });
          await this.foodGrainsRepository.save(foodGrains);
        }
        break;
      case ProduceCategory.OILSEEDS:
        if (createProduceDto.oilseeds) {
          const oilseeds = this.oilseedsRepository.create({
            ...createProduceDto.oilseeds,
            produce: savedProduce
          });
          await this.oilseedsRepository.save(oilseeds);
        }
        break;
      case ProduceCategory.FRUITS:
        if (createProduceDto.fruits) {
          const fruits = this.fruitsRepository.create({
            ...createProduceDto.fruits,
            produce: savedProduce
          });
          await this.fruitsRepository.save(fruits);
        }
        break;
      case ProduceCategory.VEGETABLES:
        if (createProduceDto.vegetables) {
          const vegetables = this.vegetablesRepository.create({
            ...createProduceDto.vegetables,
            produce: savedProduce
          });
          await this.vegetablesRepository.save(vegetables);
        }
        break;
      case ProduceCategory.SPICES:
        if (createProduceDto.spices) {
          const spices = this.spicesRepository.create({
            ...createProduceDto.spices,
            produce: savedProduce
          });
          await this.spicesRepository.save(spices);
        }
        break;
      case ProduceCategory.FIBERS:
        if (createProduceDto.fibers) {
          const fibers = this.fibersRepository.create({
            ...createProduceDto.fibers,
            produce: savedProduce
          });
          await this.fibersRepository.save(fibers);
        }
        break;
      case ProduceCategory.SUGARCANE:
        if (createProduceDto.sugarcane) {
          const sugarcane = this.sugarcaneRepository.create({
            ...createProduceDto.sugarcane,
            produce: savedProduce
          });
          await this.sugarcaneRepository.save(sugarcane);
        }
        break;
      case ProduceCategory.FLOWERS:
        if (createProduceDto.flowers) {
          const flowers = this.flowersRepository.create({
            ...createProduceDto.flowers,
            produce: savedProduce
          });
          await this.flowersRepository.save(flowers);
        }
        break;
      case ProduceCategory.MEDICINAL_PLANTS:
        if (createProduceDto.medicinalPlants) {
          const medicinalPlants = this.medicinalPlantsRepository.create({
            ...createProduceDto.medicinalPlants,
            produce: savedProduce
          });
          await this.medicinalPlantsRepository.save(medicinalPlants);
        }
        break;
    }

    // Return the produce with category details
    return this.findOne(savedProduce.id);
  }

  async findAll(filters?: ProduceFilterDto) {
    const query = this.produceRepository.createQueryBuilder('produce')
      .leftJoinAndSelect('produce.farmer', 'farmer')
      .leftJoinAndSelect('produce.foodGrains', 'foodGrains')
      .leftJoinAndSelect('produce.oilseeds', 'oilseeds')
      .leftJoinAndSelect('produce.fruits', 'fruits')
      .leftJoinAndSelect('produce.vegetables', 'vegetables')
      .leftJoinAndSelect('produce.spices', 'spices')
      .leftJoinAndSelect('produce.fibers', 'fibers')
      .leftJoinAndSelect('produce.sugarcane', 'sugarcane')
      .leftJoinAndSelect('produce.flowers', 'flowers')
      .leftJoinAndSelect('produce.medicinalPlants', 'medicinalPlants');

    // Add category filter if provided
    if (filters?.category) {
      query.andWhere('produce.category = :category', { category: filters.category });
    }

    // Add category-specific joins based on the category filter
    if (filters?.category) {
      switch (filters.category) {
        case ProduceCategory.FOOD_GRAINS:
          query.leftJoinAndSelect('produce.foodGrains', 'foodGrains');
          break;
        case ProduceCategory.OILSEEDS:
          query.leftJoinAndSelect('produce.oilseeds', 'oilseeds');
          break;
        case ProduceCategory.FRUITS:
          query.leftJoinAndSelect('produce.fruits', 'fruits');
          break;
        case ProduceCategory.VEGETABLES:
          query.leftJoinAndSelect('produce.vegetables', 'vegetables');
          break;
        case ProduceCategory.SPICES:
          query.leftJoinAndSelect('produce.spices', 'spices');
          break;
        case ProduceCategory.FIBERS:
          query.leftJoinAndSelect('produce.fibers', 'fibers');
          break;
        case ProduceCategory.SUGARCANE:
          query.leftJoinAndSelect('produce.sugarcane', 'sugarcane');
          break;
        case ProduceCategory.FLOWERS:
          query.leftJoinAndSelect('produce.flowers', 'flowers');
          break;
        case ProduceCategory.MEDICINAL_PLANTS:
          query.leftJoinAndSelect('produce.medicinalPlants', 'medicinalPlants');
          break;
      }

      query.andWhere('produce.category = :category', { category: filters.category });

      // Add category-specific filters
      if (filters.category === ProduceCategory.FOOD_GRAINS && filters.foodGrains) {
        if (filters.foodGrains.variety) {
          query.andWhere('foodGrains.variety ILIKE :variety', { variety: `%${filters.foodGrains.variety}%` });
        }
        if (filters.foodGrains.minMoistureContent) {
          query.andWhere('foodGrains.moistureContent >= :minMoistureContent', { minMoistureContent: filters.foodGrains.minMoistureContent });
        }
        if (filters.foodGrains.maxMoistureContent) {
          query.andWhere('foodGrains.moistureContent <= :maxMoistureContent', { maxMoistureContent: filters.foodGrains.maxMoistureContent });
        }
        if (filters.foodGrains.maxForeignMatter) {
          query.andWhere('foodGrains.foreignMatter <= :maxForeignMatter', { maxForeignMatter: filters.foodGrains.maxForeignMatter });
        }
        if (filters.foodGrains.minProteinContent) {
          query.andWhere('foodGrains.proteinContent >= :minProteinContent', { minProteinContent: filters.foodGrains.minProteinContent });
        }
      }

      // Add similar conditions for other categories
      // Oilseeds
      if (filters.category === ProduceCategory.OILSEEDS && filters.oilseeds) {
        if (filters.oilseeds.minOilContent) {
          query.andWhere('oilseeds.oilContent >= :minOilContent', { minOilContent: filters.oilseeds.minOilContent });
        }
        if (filters.oilseeds.seedSize) {
          query.andWhere('oilseeds.seedSize = :seedSize', { seedSize: filters.oilseeds.seedSize });
        }
        if (filters.oilseeds.maxMoistureContent) {
          query.andWhere('oilseeds.moistureContent <= :maxMoistureContent', { maxMoistureContent: filters.oilseeds.maxMoistureContent });
        }
      }

      // Fruits
      if (filters.category === ProduceCategory.FRUITS && filters.fruits) {
        if (filters.fruits.minSweetness) {
          query.andWhere('fruits.sweetness >= :minSweetness', { minSweetness: filters.fruits.minSweetness });
        }
        if (filters.fruits.size) {
          query.andWhere('fruits.size = :size', { size: filters.fruits.size });
        }
        if (filters.fruits.color) {
          query.andWhere('fruits.color ILIKE :color', { color: `%${filters.fruits.color}%` });
        }
        if (filters.fruits.ripenessLevel) {
          query.andWhere('fruits.ripenessLevel = :ripenessLevel', { ripenessLevel: filters.fruits.ripenessLevel });
        }
      }

      // Add similar conditions for other categories...
    }

    // Add base filters
    if (filters?.minPrice) {
      query.andWhere('produce.pricePerUnit >= :minPrice', { minPrice: filters.minPrice });
    }

    if (filters?.maxPrice) {
      query.andWhere('produce.pricePerUnit <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    if (filters?.location) {
      const distanceQuery = 'ST_Distance(ST_SetSRID(ST_MakePoint(farmer.location->>"lng", farmer.location->>"lat"), 4326)::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)';
      query.andWhere(
        `${distanceQuery} <= :radius`,
        {
          lng: filters.location.longitude,
          lat: filters.location.latitude,
          radius: (filters.radius || 10) * 1000 // Convert km to meters
        }
      );

      // Add distance to select if sorting by distance is requested
      const hasDistanceSort = filters.sort?.groups?.some(group => 
        group.fields.some(field => field.field === SortableField.DISTANCE)
      );
      if (hasDistanceSort) {
        query.addSelect(`${distanceQuery}`, 'distance');
      }
    }

    // Apply sorting
    if (filters?.sort?.groups?.length > 0) {
      // Sort the groups by priority (1 being highest)
      const sortedGroups = [...filters.sort.groups].sort((a, b) => a.priority - b.priority);

      for (const group of sortedGroups) {
        // Check group conditions if any
        let groupConditionsMet = true;
        if (group.conditions?.length > 0) {
          for (const condition of group.conditions) {
            const value = this.getFieldValue(filters, condition.field);
            if (!this.checkCondition(value, condition.operator, condition.value)) {
              groupConditionsMet = false;
              break;
            }
          }
        }

        // Apply group's sort fields if conditions are met
        if (groupConditionsMet) {
          for (const sortField of group.fields) {
            // Check field-specific conditions if any
            let fieldConditionsMet = true;
            if (sortField.conditions?.length > 0) {
              for (const condition of sortField.conditions) {
                const value = this.getFieldValue(filters, condition.field);
                if (!this.checkCondition(value, condition.operator, condition.value)) {
                  fieldConditionsMet = false;
                  break;
                }
              }
            }

            // Apply sort if conditions are met
            if (fieldConditionsMet) {
              this.applySortField(query, filters, sortField.field, sortField.order);
            }
          }
        }
      }
    }

    const [items, total] = await query
      .skip((filters?.page - 1) * filters?.limit)
      .take(filters?.limit)
      .getManyAndCount();

    return {
      items,
      total,
      hasMore: total > (filters?.page || 1) * (filters?.limit || 10)
    };
  }

  private getFieldValue(filters: ProduceFilterDto, field: SortableField): any {
    switch (field) {
      case SortableField.PRICE:
        return filters.minPrice || filters.maxPrice;
      case SortableField.DISTANCE:
        return filters.radius;
      case SortableField.MOISTURE_CONTENT:
        return filters.foodGrains?.minMoistureContent || filters.foodGrains?.maxMoistureContent;
      case SortableField.PROTEIN_CONTENT:
        return filters.foodGrains?.minProteinContent;
      case SortableField.FOREIGN_MATTER:
        return filters.foodGrains?.maxForeignMatter;
      case SortableField.OIL_CONTENT:
        return filters.oilseeds?.minOilContent;
      case SortableField.SWEETNESS:
        return filters.fruits?.minSweetness;
      // Add other field mappings as needed
      default:
        return null;
    }
  }

  private checkCondition(value: any, operator: SortConditionOperator, compareValue: any): boolean {
    if (value === null || value === undefined) return false;

    switch (operator) {
      case SortConditionOperator.EQUALS:
        return value === compareValue;
      case SortConditionOperator.NOT_EQUALS:
        return value !== compareValue;
      case SortConditionOperator.GREATER_THAN:
        return value > compareValue;
      case SortConditionOperator.LESS_THAN:
        return value < compareValue;
      case SortConditionOperator.GREATER_THAN_EQUALS:
        return value >= compareValue;
      case SortConditionOperator.LESS_THAN_EQUALS:
        return value <= compareValue;
      default:
        return false;
    }
  }

  private applySortField(query: any, filters: ProduceFilterDto, field: SortableField, order: SortOrder): void {
    // Handle base fields
    switch (field) {
      case SortableField.PRICE:
        query.addOrderBy('produce.pricePerUnit', order);
        return;
      case SortableField.DATE_LISTED:
        query.addOrderBy('produce.createdAt', order);
        return;
      case SortableField.DISTANCE:
        if (filters.location) {
          query.addOrderBy('distance', order);
        }
        return;
    }

    // Handle category-specific fields
    if (filters.category === ProduceCategory.FOOD_GRAINS) {
      switch (field) {
        case SortableField.MOISTURE_CONTENT:
          query.addOrderBy('foodGrains.moistureContent', order);
          return;
        case SortableField.PROTEIN_CONTENT:
          query.addOrderBy('foodGrains.proteinContent', order);
          return;
        case SortableField.FOREIGN_MATTER:
          query.addOrderBy('foodGrains.foreignMatter', order);
          return;
      }
    }

    // Add other category-specific sort fields...
    // (Previous category-specific sorting logic remains the same)
  }

  async findByFarmerId(farmerId: string) {
    return this.produceRepository
      .createQueryBuilder('produce')
      .leftJoinAndSelect('produce.farmer', 'farmer')
      .leftJoinAndSelect('produce.foodGrains', 'foodGrains')
      .leftJoinAndSelect('produce.oilseeds', 'oilseeds')
      .leftJoinAndSelect('produce.fruits', 'fruits')
      .leftJoinAndSelect('produce.vegetables', 'vegetables')
      .leftJoinAndSelect('produce.spices', 'spices')
      .leftJoinAndSelect('produce.fibers', 'fibers')
      .leftJoinAndSelect('produce.sugarcane', 'sugarcane')
      .leftJoinAndSelect('produce.flowers', 'flowers')
      .leftJoinAndSelect('produce.medicinalPlants', 'medicinalPlants')
      .where('produce.farmerId = :farmerId', { farmerId })
      .getMany();
  }

  async findOne(id: string): Promise<Produce> {
    const produce = await this.produceRepository
      .createQueryBuilder('produce')
      .leftJoinAndSelect('produce.farmer', 'farmer')
      .leftJoinAndSelect('produce.foodGrains', 'foodGrains')
      .leftJoinAndSelect('produce.oilseeds', 'oilseeds')
      .leftJoinAndSelect('produce.fruits', 'fruits')
      .leftJoinAndSelect('produce.vegetables', 'vegetables')
      .leftJoinAndSelect('produce.spices', 'spices')
      .leftJoinAndSelect('produce.fibers', 'fibers')
      .leftJoinAndSelect('produce.sugarcane', 'sugarcane')
      .leftJoinAndSelect('produce.flowers', 'flowers')
      .leftJoinAndSelect('produce.medicinalPlants', 'medicinalPlants')
      .where('produce.id = :id', { id })
      .getOne();

    if (!produce) {
      throw new NotFoundException(`Produce with ID "${id}" not found`);
    }
    return produce;
  }

  async update(id: string, farmerId: string, updateProduceDto: UpdateProduceDto) {
    const produce = await this.findOne(id);
    
    if (produce.farmerId !== farmerId) {
      throw new ForbiddenException('You can only update your own produce');
    }

    // If farmId is provided, verify it belongs to the farmer
    if (updateProduceDto.farmId) {
      const farm = await this.farmDetailsRepository.findOne({
        where: { id: updateProduceDto.farmId, farmerId }
      });

      if (!farm) {
        throw new NotFoundException('Farm not found or does not belong to the farmer');
      }
    }

    // Recalculate total price if either pricePerUnit or quantity is updated
    let updatedPrice = produce.price;
    if (updateProduceDto.pricePerUnit !== undefined || updateProduceDto.quantity !== undefined) {
      const newPricePerUnit = updateProduceDto.pricePerUnit ?? produce.pricePerUnit;
      const newQuantity = updateProduceDto.quantity ?? produce.quantity;
      updatedPrice = newPricePerUnit * newQuantity;
    }

    // Update main produce entity
    Object.assign(produce, {
      ...updateProduceDto,
      price: updatedPrice,
      location: updateProduceDto.location ? {
        latitude: updateProduceDto.location.latitude,
        longitude: updateProduceDto.location.longitude
      } : produce.location
    });

    const savedProduce = await this.produceRepository.save(produce);

    // Update category-specific details if provided
    if (produce.category === ProduceCategory.FOOD_GRAINS && updateProduceDto.foodGrains) {
      await this.foodGrainsRepository.update({ produce: { id } }, updateProduceDto.foodGrains);
    }
    else if (produce.category === ProduceCategory.OILSEEDS && updateProduceDto.oilseeds) {
      await this.oilseedsRepository.update({ produce: { id } }, updateProduceDto.oilseeds);
    }
    else if (produce.category === ProduceCategory.FRUITS && updateProduceDto.fruits) {
      await this.fruitsRepository.update({ produce: { id } }, updateProduceDto.fruits);
    }
    else if (produce.category === ProduceCategory.VEGETABLES && updateProduceDto.vegetables) {
      await this.vegetablesRepository.update({ produce: { id } }, updateProduceDto.vegetables);
    }
    else if (produce.category === ProduceCategory.SPICES && updateProduceDto.spices) {
      await this.spicesRepository.update({ produce: { id } }, updateProduceDto.spices);
    }
    else if (produce.category === ProduceCategory.FIBERS && updateProduceDto.fibers) {
      await this.fibersRepository.update({ produce: { id } }, updateProduceDto.fibers);
    }
    else if (produce.category === ProduceCategory.SUGARCANE && updateProduceDto.sugarcane) {
      await this.sugarcaneRepository.update({ produce: { id } }, updateProduceDto.sugarcane);
    }
    else if (produce.category === ProduceCategory.FLOWERS && updateProduceDto.flowers) {
      await this.flowersRepository.update({ produce: { id } }, updateProduceDto.flowers);
    }
    else if (produce.category === ProduceCategory.MEDICINAL_PLANTS && updateProduceDto.medicinalPlants) {
      await this.medicinalPlantsRepository.update({ produce: { id } }, updateProduceDto.medicinalPlants);
    }

    // Return updated produce with category details
    return this.findOne(id);
  }

  async remove(id: string, farmerId: string) {
    const produce = await this.findOne(id);

    if (produce.farmerId !== farmerId) {
      throw new ForbiddenException('You can only delete your own produce listings');
    }

    await this.produceRepository.remove(produce);
    return { id };
  }

  async findNearby(params: {
    latitude: number;
    longitude: number;
    radiusInKm: number;
    limit?: number;
  }): Promise<Produce[]> {
    const { latitude, longitude, radiusInKm, limit = 10 } = params;
    
    // Using Haversine formula in raw SQL for PostgreSQL
    const query = this.produceRepository.createQueryBuilder('produce')
      .where(`
        ST_DistanceSphere(
          ST_MakePoint(produce.location->>'lng', produce.location->>'lat')::geometry,
          ST_MakePoint(:longitude, :latitude)::geometry
        ) <= :radius
      `, {
        latitude,
        longitude,
        radius: radiusInKm * 1000 // Convert km to meters
      })
      .orderBy(`
        ST_DistanceSphere(
          ST_MakePoint(produce.location->>'lng', produce.location->>'lat')::geometry,
          ST_MakePoint(:longitude, :latitude)::geometry
        )
      `)
      .limit(limit);

    return query.getMany();
  }

  async uploadImage(file: Express.Multer.File): Promise<{ imageUrl: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Upload file to S3 and get URL
    const imageUrl = await this.s3Service.uploadFile(file, 'images');
    return { imageUrl };
  }

  async deleteMedia(url: string, farmerId: string): Promise<{ success: boolean }> {
    // Find all produces by this farmer that have this image or video
    const produces = await this.produceRepository.find({
      where: [
        { farmerId, imageUrls: Raw(alias => `${alias} @> ARRAY[:url]`, { url }) },
        { farmerId, videoUrl: url }
      ]
    });

    // Update all produces that reference this media
    for (const produce of produces) {
      // If it's an image
      if (produce.imageUrls.includes(url)) {
        produce.imageUrls = produce.imageUrls.filter(imgUrl => imgUrl !== url);
        // If it was the primary image, clear that reference
        if (produce.primaryImageUrl === url) {
          produce.primaryImageUrl = produce.imageUrls[0] || null;
        }
      }
      // If it's a video
      if (produce.videoUrl === url) {
        produce.videoUrl = null;
      }
      await this.produceRepository.save(produce);
    }

    // Delete the file from S3
    await this.s3Service.deleteFile(url);
    return { success: true };
  }

  async uploadVideo(file: Express.Multer.File): Promise<{ videoUrl: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Upload file to S3 and get URL
    const videoUrl = await this.s3Service.uploadFile(file, 'videos');
    return { videoUrl };
  }
} 