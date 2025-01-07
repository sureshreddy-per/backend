import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer, OfferStatus } from '../entities/offer.entity';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { UpdateOfferDto } from '../dto/update-offer.dto';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
  ) {}

  async create(createOfferDto: CreateOfferDto): Promise<Offer> {
    const offer = this.offerRepository.create({
      buyer_id: createOfferDto.buyer_id,
      status: OfferStatus.PENDING,
      produce_id: createOfferDto.produce_id,
      price: createOfferDto.price,
      quantity: createOfferDto.quantity,
      message: createOfferDto.message,
      valid_until: createOfferDto.valid_until,
    });

    return this.offerRepository.save(offer);
  }

  async accept(id: string): Promise<Offer> {
    const offer = await this.findOne(id);
    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Offer cannot be accepted');
    }

    const updatedOffer = await this.offerRepository.save({
      id,
      status: OfferStatus.ACCEPTED,
      metadata: {
        accepted_at: new Date(),
      },
    });

    return updatedOffer;
  }

  async reject(id: string, reason: string): Promise<Offer> {
    const offer = await this.findOne(id);
    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Offer cannot be rejected');
    }

    const updatedOffer = await this.offerRepository.save({
      id,
      status: OfferStatus.REJECTED,
      metadata: {
        rejection_reason: reason,
        rejected_at: new Date(),
      },
    });

    return updatedOffer;
  }

  async cancel(id: string, reason: string): Promise<Offer> {
    const offer = await this.findOne(id);
    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Offer cannot be cancelled');
    }

    const updatedOffer = await this.offerRepository.save({
      id,
      status: OfferStatus.CANCELLED,
      metadata: {
        cancellation_reason: reason,
        cancelled_at: new Date(),
      },
    });

    return updatedOffer;
  }

  async findAll(): Promise<Offer[]> {
    return this.offerRepository.find({
      relations: ['produce', 'buyer'],
    });
  }

  async findOne(id: string): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id },
      relations: ['produce', 'buyer'],
    });

    if (!offer) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }

    return offer;
  }

  async update(id: string, updateOfferDto: UpdateOfferDto): Promise<Offer> {
    const offer = await this.findOne(id);
    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Only pending offers can be updated');
    }

    Object.assign(offer, updateOfferDto);
    return this.offerRepository.save(offer);
  }

  async remove(id: string): Promise<void> {
    const offer = await this.findOne(id);
    await this.offerRepository.remove(offer);
  }
} 