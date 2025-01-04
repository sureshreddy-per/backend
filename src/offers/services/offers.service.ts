import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from '../entities/offer.entity';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { UpdateOfferDto } from '../dto/update-offer.dto';
import { OfferStatus } from '../enums/offer-status.enum';

@Injectable()
export class OffersService {
  private readonly MIN_PRICE = 0;
  private readonly MAX_PRICE = 1000000;

  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>
  ) {}

  async create(createOfferDto: CreateOfferDto) {
    if (createOfferDto.pricePerUnit <= this.MIN_PRICE) {
      throw new BadRequestException('Price must be greater than zero');
    }

    if (createOfferDto.pricePerUnit > this.MAX_PRICE) {
      throw new BadRequestException('Price exceeds maximum allowed value');
    }

    const offer = new Offer();
    const newOffer = {
      ...createOfferDto,
      status: OfferStatus.PENDING,
      metadata: {
        qualityGrade: createOfferDto.qualityGrade,
        priceHistory: [],
        lastPriceUpdate: {
          oldPrice: 0,
          newPrice: createOfferDto.pricePerUnit,
          timestamp: new Date()
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    Object.assign(offer, newOffer);
    return this.offerRepository.save(offer);
  }

  async findAll() {
    return this.offerRepository.find({
      relations: ['buyer', 'produce']
    });
  }

  async findOne(id: string) {
    return this.offerRepository.findOne({
      where: { id },
      relations: ['buyer', 'produce']
    });
  }

  async update(id: string, updateOfferDto: UpdateOfferDto) {
    const offer = await this.findOne(id);
    if (!offer) return null;

    const oldPrice = offer.pricePerUnit;
    const newPrice = updateOfferDto.pricePerUnit || oldPrice;

    const updatedOffer = {
      ...offer,
      ...updateOfferDto,
      metadata: {
        ...offer.metadata,
        priceHistory: [
          ...(offer.metadata.priceHistory || []),
          {
            oldPrice,
            newPrice,
            timestamp: new Date()
          }
        ],
        lastPriceUpdate: {
          oldPrice,
          newPrice,
          timestamp: new Date()
        }
      },
      updatedAt: new Date()
    };

    return this.offerRepository.save(updatedOffer);
  }

  async accept(offerId: string, farmerId: string) {
    const offer = await this.findOne(offerId);
    if (!offer) return null;

    if (offer.produce.farmerId !== farmerId) {
      throw new Error('Not authorized to accept this offer');
    }

    const updatedOffer = {
      ...offer,
      status: OfferStatus.ACCEPTED,
      metadata: {
        ...offer.metadata,
        acceptedAt: new Date()
      },
      updatedAt: new Date()
    };

    return this.offerRepository.save(updatedOffer);
  }

  async reject(offerId: string, farmerId: string, reason: string) {
    const offer = await this.findOne(offerId);
    if (!offer) return null;

    if (offer.produce.farmerId !== farmerId) {
      throw new Error('Not authorized to reject this offer');
    }

    const updatedOffer = {
      ...offer,
      status: OfferStatus.REJECTED,
      metadata: {
        ...offer.metadata,
        rejectionReason: reason,
        rejectedAt: new Date()
      },
      updatedAt: new Date()
    };

    return this.offerRepository.save(updatedOffer);
  }

  async cancel(offerId: string, buyerId: string, reason: string) {
    const offer = await this.findOne(offerId);
    if (!offer) return null;

    if (offer.buyerId !== buyerId) {
      throw new Error('Not authorized to cancel this offer');
    }

    const updatedOffer = {
      ...offer,
      status: OfferStatus.CANCELLED,
      metadata: {
        ...offer.metadata,
        cancellationReason: reason,
        cancelledAt: new Date()
      },
      updatedAt: new Date()
    };

    return this.offerRepository.save(updatedOffer);
  }
} 