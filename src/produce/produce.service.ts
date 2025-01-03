import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produce, ProduceStatus } from './entities/produce.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CreateProduceDto } from './dto/create-produce.dto';
import { UpdateProduceDto } from './dto/update-produce.dto';

@Injectable()
export class ProduceService {
  constructor(
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createProduceDto: CreateProduceDto, customerId: string): Promise<Produce> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const produce = this.produceRepository.create({
      ...createProduceDto,
      customerId,
      status: ProduceStatus.PENDING,
    });

    return this.produceRepository.save(produce);
  }

  async findAll(page = 1, limit = 10) {
    const [produces, total] = await this.produceRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['customer', 'quality'],
      order: { createdAt: 'DESC' },
    });

    return {
      produces,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Produce> {
    const produce = await this.produceRepository.findOne({
      where: { id },
      relations: ['customer', 'quality'],
    });

    if (!produce) {
      throw new NotFoundException('Produce not found');
    }

    return produce;
  }

  async update(id: string, updateProduceDto: UpdateProduceDto): Promise<Produce> {
    const produce = await this.findOne(id);
    const updatedProduce = Object.assign(produce, updateProduceDto);
    return this.produceRepository.save(updatedProduce);
  }

  async updateStatus(id: string, status: ProduceStatus): Promise<Produce> {
    const produce = await this.findOne(id);
    produce.status = status;
    return this.produceRepository.save(produce);
  }

  async findByCustomer(customerId: string, page = 1, limit = 10) {
    const [produces, total] = await this.produceRepository.findAndCount({
      where: { customerId },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['quality'],
      order: { createdAt: 'DESC' },
    });

    return {
      produces,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateLocation(id: string, lat: number, lng: number): Promise<Produce> {
    const produce = await this.findOne(id);
    produce.lat = lat;
    produce.lng = lng;
    return this.produceRepository.save(produce);
  }

  async addPhotos(id: string, photos: string[]): Promise<Produce> {
    const produce = await this.findOne(id);
    produce.photos = [...produce.photos, ...photos];
    return this.produceRepository.save(produce);
  }

  async removePhoto(id: string, photoUrl: string): Promise<Produce> {
    const produce = await this.findOne(id);
    produce.photos = produce.photos.filter(photo => photo !== photoUrl);
    return this.produceRepository.save(produce);
  }

  async updateVideo(id: string, videoUrl: string): Promise<Produce> {
    const produce = await this.findOne(id);
    produce.video = videoUrl;
    return this.produceRepository.save(produce);
  }
} 