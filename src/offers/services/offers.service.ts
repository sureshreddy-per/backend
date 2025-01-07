import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { Offer, OfferStatus } from '../entities/offer.entity';
import { BaseService } from '../../common/base.service';

@Injectable()
export class OffersService extends BaseService<Offer> {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>
  ) {
    super(offerRepository);
  }

  async findOne(options: FindManyOptions<Offer> | string) {
    if (typeof options === 'string') {
      return this.offerRepository.findOne({ where: { id: options } });
    }
    return this.offerRepository.findOne(options);
  }

  async accept(id: string) {
    const offer = await this.findOne(id);
    if (!offer) {
      throw new Error('Offer not found');
    }
    offer.status = OfferStatus.ACCEPTED;
    return this.offerRepository.save(offer);
  }

  async reject(id: string, reason: string) {
    const offer = await this.findOne(id);
    if (!offer) {
      throw new Error('Offer not found');
    }
    offer.status = OfferStatus.REJECTED;
    offer.rejection_reason = reason;
    return this.offerRepository.save(offer);
  }

  async cancel(id: string, reason: string) {
    const offer = await this.findOne(id);
    if (!offer) {
      throw new Error('Offer not found');
    }
    offer.status = OfferStatus.CANCELLED;
    offer.cancellation_reason = reason;
    return this.offerRepository.save(offer);
  }

  async remove(id: string) {
    const offer = await this.findOne(id);
    if (!offer) {
      throw new Error('Offer not found');
    }
    return this.offerRepository.remove(offer);
  }
} 