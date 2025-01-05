import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Offer, OfferStatus } from '../entities/offer.entity';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { UpdateOfferDto } from '../dto/update-offer.dto';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
  ) {}

  async create(createOfferDto: CreateOfferDto, buyerId: string): Promise<Offer> {
    const offerData: DeepPartial<Offer> = {
      ...createOfferDto,
      buyerId,
      status: OfferStatus.PENDING,
    };

    const offer = this.offerRepository.create(offerData);
    return this.offerRepository.save(offer);
  }

  async accept(id: string): Promise<Offer> {
    const offer = await this.findOne(id);

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Can only accept pending offers');
    }

    const updatedData: DeepPartial<Offer> = {
      id: offer.id,
      status: OfferStatus.ACCEPTED,
      acceptedAt: new Date(),
      metadata: {
        ...offer.metadata,
        acceptedAt: new Date(),
      },
    };

    return this.offerRepository.save(updatedData);
  }

  async reject(id: string, reason: string): Promise<Offer> {
    const offer = await this.findOne(id);

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Can only reject pending offers');
    }

    const updatedData: DeepPartial<Offer> = {
      id: offer.id,
      status: OfferStatus.REJECTED,
      rejectedAt: new Date(),
      rejectionReason: reason,
      metadata: {
        ...offer.metadata,
        rejectionReason: reason,
        rejectedAt: new Date(),
      },
    };

    return this.offerRepository.save(updatedData);
  }

  async cancel(id: string, reason: string): Promise<Offer> {
    const offer = await this.findOne(id);

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Can only cancel pending offers');
    }

    const updatedData: DeepPartial<Offer> = {
      id: offer.id,
      status: OfferStatus.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason: reason,
      metadata: {
        ...offer.metadata,
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
    };

    return this.offerRepository.save(updatedData);
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
} 