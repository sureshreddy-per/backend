import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { Produce, ProduceCategory, ProduceStatus } from './entities/produce.entity';
import { CreateProduceDto } from './dto/create-produce.dto';
import { UpdateProduceDto } from './dto/update-produce.dto';
import { S3Service } from '../common/services/s3.service';
import { GeospatialService } from '../common/services/geospatial.service';
import { PaginatedResponse } from './interfaces/paginated-response.interface';

interface FindAllParams {
  category?: ProduceCategory;
  minPrice?: number;
  maxPrice?: number;
  status?: ProduceStatus;
  location?: {
    lat: number;
    lon: number;
    radius: number;
  };
  page?: number;
  limit?: number;
  sortBy?: keyof Produce;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class ProduceService {
  constructor(
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>,
    private readonly s3Service: S3Service,
    private readonly geospatialService: GeospatialService,
  ) {}

  async create(createProduceDto: CreateProduceDto, files: { images?: Express.Multer.File[], video?: Express.Multer.File[] }): Promise<Produce> {
    const produce = this.produceRepository.create({
      ...createProduceDto,
      status: ProduceStatus.AVAILABLE,
    });

    if (files?.images?.length) {
      try {
        const imageUrls = await Promise.all(
          files.images.map(file => this.s3Service.uploadFile(file, 'images'))
        );
        produce.images = imageUrls;
      } catch (error) {
        throw new BadRequestException('Failed to upload images');
      }
    }

    if (files?.video?.length) {
      try {
        produce.video = await this.s3Service.uploadFile(files.video[0], 'videos');
      } catch (error) {
        throw new BadRequestException('Failed to upload video');
      }
    }

    return this.produceRepository.save(produce);
  }

  async findAll(params: FindAllParams): Promise<PaginatedResponse<Produce>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      ...filters
    } = params;

    const where: FindOptionsWhere<Produce> = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.minPrice || filters.maxPrice) {
      where.price_per_unit = Between(
        filters.minPrice || 0,
        filters.maxPrice || Number.MAX_SAFE_INTEGER
      );
    }

    const options: FindManyOptions<Produce> = {
      where,
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['farmer', 'farm'],
    };

    const [items, total] = await this.produceRepository.findAndCount(options);

    let filteredItems = items;
    if (filters.location) {
      filteredItems = items.filter(produce => {
        const distance = this.geospatialService.calculateDistance(
          filters.location!.lat,
          filters.location!.lon,
          produce.latitude,
          produce.longitude
        );
        return distance <= filters.location!.radius;
      });
    }

    return {
      items: filteredItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Produce> {
    const produce = await this.produceRepository.findOne({
      where: { id },
      relations: ['farmer', 'farm'],
    });
    if (!produce) {
      throw new NotFoundException(`Produce with ID ${id} not found`);
    }
    return produce;
  }

  async update(id: string, updateProduceDto: UpdateProduceDto, files: { images?: Express.Multer.File[], video?: Express.Multer.File[] }): Promise<Produce> {
    const produce = await this.findOne(id);

    // Handle file uploads
    if (files?.images?.length) {
      try {
        // Delete old images
        if (produce.images?.length) {
          await Promise.all(
            produce.images.map(url => this.s3Service.deleteFile(url))
          );
        }
        
        const imageUrls = await Promise.all(
          files.images.map(file => this.s3Service.uploadFile(file, 'images'))
        );
        updateProduceDto.images = imageUrls;
      } catch (error) {
        throw new BadRequestException('Failed to handle image uploads');
      }
    }

    if (files?.video?.length) {
      try {
        // Delete old video
        if (produce.video) {
          await this.s3Service.deleteFile(produce.video);
        }
        updateProduceDto.video = await this.s3Service.uploadFile(files.video[0], 'videos');
      } catch (error) {
        throw new BadRequestException('Failed to handle video upload');
      }
    }

    Object.assign(produce, updateProduceDto);
    return this.produceRepository.save(produce);
  }

  async remove(id: string): Promise<{ id: string }> {
    const produce = await this.findOne(id);
    
    try {
      // Delete associated files
      if (produce.images?.length) {
        await Promise.all(
          produce.images.map(url => this.s3Service.deleteFile(url))
        );
      }
      
      if (produce.video) {
        await this.s3Service.deleteFile(produce.video);
      }

      await this.produceRepository.remove(produce);
      return { id };
    } catch (error) {
      throw new BadRequestException('Failed to delete produce and associated files');
    }
  }

  async findNearby(lat: number, lon: number, radius: number): Promise<Produce[]> {
    const boundingBox = this.geospatialService.getBoundingBox(lat, lon, radius);
    
    const produces = await this.produceRepository.find({
      where: {
        latitude: Between(boundingBox.minLat, boundingBox.maxLat),
        longitude: Between(boundingBox.minLon, boundingBox.maxLon),
        status: ProduceStatus.AVAILABLE, // Only show available produce
      },
      relations: ['farmer', 'farm'],
    });

    return produces.filter(produce => {
      const distance = this.geospatialService.calculateDistance(
        lat,
        lon,
        produce.latitude,
        produce.longitude
      );
      return distance <= radius;
    });
  }
} 