import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { Offer, OfferStatus } from '../entities/offer.entity';
import { BaseService } from '../../common/base.service';
import { CreateOfferDto } from '../dto/create-offer.dto';

@Injectable()
export class OffersService extends BaseService<Offer> {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>
  ) {
    super(offerRepository);
  }

  async create(createOfferDto: CreateOfferDto): Promise<Offer> {
    const entity = this.offerRepository.create({
      ...createOfferDto,
      status: OfferStatus.PENDING,
    });
    return this.offerRepository.save(entity);
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

  async findByBuyer(buyerId: string) {
    return this.offerRepository.find({
      where: { buyer_id: buyerId },
      relations: ['produce', 'buyer'],
      order: { created_at: 'DESC' },
    });
  }

  async findByFarmer(farmerId: string) {
    return this.offerRepository
      .createQueryBuilder('offer')
      .innerJoinAndSelect('offer.produce', 'produce')
      .innerJoinAndSelect('offer.buyer', 'buyer')
      .where('produce.farmer_id = :farmerId', { farmerId })
      .orderBy('offer.created_at', 'DESC')
      .getMany();
  }

  async updateStatus(id: string, status: OfferStatus): Promise<Offer> {
    const offer = await this.findOne(id);
    offer.status = status;
    return this.offerRepository.save(offer);
  }
}