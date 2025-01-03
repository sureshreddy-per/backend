import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer, OfferStatus } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { ProduceService } from '../produce/produce.service';
import { ProduceStatus } from '../produce/entities/produce.entity';
import { OffersGateway } from './offers.gateway';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    private readonly produceService: ProduceService,
    private readonly offersGateway: OffersGateway,
  ) {}

  async create(createOfferDto: CreateOfferDto, buyerId: string): Promise<Offer> {
    const produce = await this.produceService.findOne(createOfferDto.produceId);

    if (produce.status !== ProduceStatus.PENDING) {
      throw new BadRequestException('Cannot make offer on non-pending produce');
    }

    const offer = this.offerRepository.create({
      ...createOfferDto,
      buyerId,
      status: OfferStatus.PENDING,
    });

    const savedOffer = await this.offerRepository.save(offer);
    const offerWithRelations = await this.findOne(savedOffer.id);
    
    // Notify about the new offer
    this.offersGateway.notifyNewOffer(offerWithRelations);

    return offerWithRelations;
  }

  async findAll(page = 1, limit = 10) {
    const [offers, total] = await this.offerRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['buyer', 'produce'],
      order: { createdAt: 'DESC' },
    });

    return {
      offers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id },
      relations: ['buyer', 'produce'],
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    return offer;
  }

  async update(id: string, updateOfferDto: UpdateOfferDto): Promise<Offer> {
    const offer = await this.findOne(id);
    
    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Can only update pending offers');
    }

    const updatedOffer = Object.assign(offer, updateOfferDto);
    const savedOffer = await this.offerRepository.save(updatedOffer);
    
    // Notify about the offer update
    this.offersGateway.notifyOfferStatusUpdate(savedOffer);

    return savedOffer;
  }

  async findByBuyer(buyerId: string, page = 1, limit = 10) {
    const [offers, total] = await this.offerRepository.findAndCount({
      where: { buyerId },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['produce'],
      order: { createdAt: 'DESC' },
    });

    return {
      offers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByProduce(produceId: string, page = 1, limit = 10) {
    const [offers, total] = await this.offerRepository.findAndCount({
      where: { produceId },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['buyer'],
      order: { createdAt: 'DESC' },
    });

    return {
      offers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async accept(id: string): Promise<Offer> {
    const offer = await this.findOne(id);
    
    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Can only accept pending offers');
    }

    // Update produce status
    await this.produceService.updateStatus(offer.produceId, ProduceStatus.IN_PROGRESS);

    // Update and save the offer
    offer.status = OfferStatus.ACCEPTED;
    const savedOffer = await this.offerRepository.save(offer);
    
    // Notify about the offer acceptance
    this.offersGateway.notifyOfferStatusUpdate(savedOffer);

    return savedOffer;
  }

  async reject(id: string): Promise<Offer> {
    const offer = await this.findOne(id);
    
    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Can only reject pending offers');
    }

    offer.status = OfferStatus.REJECTED;
    const savedOffer = await this.offerRepository.save(offer);
    
    // Notify about the offer rejection
    this.offersGateway.notifyOfferStatusUpdate(savedOffer);

    return savedOffer;
  }
} 