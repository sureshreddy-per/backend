import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Offer, OfferStatus } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { User } from '../auth/entities/user.entity';
import { Produce, ProduceStatus } from '../produce/entities/produce.entity';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { ProduceService } from '../produce/produce.service';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>,
    private readonly eventEmitter: EventEmitter2,
    private readonly produceService: ProduceService,
  ) {}

  async autoCreateOffer(buyerId: string, produceId: string, gradeUsed: string, quotedPrice: number): Promise<Offer> {
    const buyer = await this.userRepository.findOne({
      where: { id: buyerId },
    });

    if (!buyer || !buyer.isBuyer) {
      throw new BadRequestException('Invalid buyer');
    }

    const produce = await this.produceRepository.findOne({
      where: { id: produceId },
      relations: ['user'],
    });

    if (!produce) {
      throw new NotFoundException('Produce not found');
    }

    if (produce.status !== ProduceStatus.PENDING) {
      throw new BadRequestException('Produce is not ready for offers');
    }

    const offer = this.offerRepository.create({
      buyerId,
      produceId,
      gradeUsed,
      quotedPrice,
      status: OfferStatus.PENDING,
      metadata: {
        autoCalculated: true,
        originalPrice: quotedPrice,
      },
    });

    const savedOffer = await this.offerRepository.save(offer);

    // Emit offer created event
    this.eventEmitter.emit('offer.created', {
      offerId: savedOffer.id,
      buyerId: savedOffer.buyerId,
      produceId: savedOffer.produceId,
      quotedPrice: savedOffer.quotedPrice,
    });

    return savedOffer;
  }

  async findOne(id: string): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id },
      relations: ['buyer', 'produce', 'produce.user'],
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    return offer;
  }

  async findByProduce(produceId: string, page = 1, limit = 10) {
    const [offers, total] = await this.offerRepository.findAndCount({
      where: { produceId },
      relations: ['buyer'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      offers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByBuyer(buyerId: string, page = 1, limit = 10) {
    const [offers, total] = await this.offerRepository.findAndCount({
      where: { buyerId },
      relations: ['produce', 'produce.user'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      offers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async overrideOffer(id: string, buyerId: string, newPrice: number, overrideReason: string): Promise<Offer> {
    const offer = await this.findOne(id);

    if (offer.buyerId !== buyerId) {
      throw new BadRequestException('You can only override your own offers');
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Can only override pending offers');
    }

    offer.quotedPrice = newPrice;
    offer.metadata = {
      ...offer.metadata,
      overrideReason,
      autoCalculated: false,
      originalPrice: offer.metadata.originalPrice || offer.quotedPrice,
    };

    const savedOffer = await this.offerRepository.save(offer);

    // Emit offer updated event
    this.eventEmitter.emit('offer.updated', {
      offerId: savedOffer.id,
      buyerId: savedOffer.buyerId,
      produceId: savedOffer.produceId,
      quotedPrice: savedOffer.quotedPrice,
    });

    return savedOffer;
  }

  async acceptOffer(id: string, farmerId: string): Promise<Offer> {
    const offer = await this.findOne(id);

    if (offer.produce.farmerId !== farmerId) {
      throw new BadRequestException('Only the farmer can accept/reject offers');
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Can only accept pending offers');
    }

    offer.status = OfferStatus.ACCEPTED;
    offer.finalPrice = offer.quotedPrice;

    // Update produce status using ProduceService
    await this.produceService.updateStatus(offer.produceId, ProduceStatus.FINAL_PRICE, farmerId);

    const savedOffer = await this.offerRepository.save(offer);

    // Emit offer accepted event
    this.eventEmitter.emit('offer.accepted', {
      offerId: savedOffer.id,
      buyerId: savedOffer.buyerId,
      produceId: savedOffer.produceId,
      finalPrice: savedOffer.finalPrice,
    });

    return savedOffer;
  }

  async rejectOffer(id: string, farmerId: string): Promise<Offer> {
    const offer = await this.findOne(id);

    if (offer.produce.farmerId !== farmerId) {
      throw new BadRequestException('Only the farmer can accept/reject offers');
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Can only reject pending offers');
    }

    offer.status = OfferStatus.REJECTED;
    const savedOffer = await this.offerRepository.save(offer);

    // Emit offer rejected event
    this.eventEmitter.emit('offer.rejected', {
      offerId: savedOffer.id,
      buyerId: savedOffer.buyerId,
      produceId: savedOffer.produceId,
    });

    return savedOffer;
  }

  async create(createOfferDto: CreateOfferDto, buyerId: string): Promise<Offer> {
    const buyer = await this.userRepository.findOne({ where: { id: buyerId } });
    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }

    const produce = await this.produceRepository.findOne({
      where: { id: createOfferDto.produceId },
    });
    if (!produce) {
      throw new NotFoundException('Produce not found');
    }

    const offer = this.offerRepository.create({
      ...createOfferDto,
      buyerId,
      status: OfferStatus.PENDING,
    });

    const savedOffer = await this.offerRepository.save(offer);

    this.eventEmitter.emit('offer.created', {
      offerId: savedOffer.id,
      produceId: savedOffer.produceId,
      buyerId: savedOffer.buyerId,
    });

    return savedOffer;
  }

  async update(id: string, updateOfferDto: UpdateOfferDto, currentUserId: string): Promise<Offer> {
    const offer = await this.findOne(id);
    
    // Verify that only the original buyer can modify the offer
    if (offer.buyerId !== currentUserId) {
      throw new BadRequestException('Only the original buyer can modify this offer');
    }

    // Verify that only pending offers can be modified
    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Only pending offers can be modified');
    }
    
    const updatedOffer = this.offerRepository.merge(offer, updateOfferDto);
    const savedOffer = await this.offerRepository.save(updatedOffer);

    this.eventEmitter.emit('offer.updated', {
      offerId: savedOffer.id,
      produceId: savedOffer.produceId,
      buyerId: savedOffer.buyerId,
    });

    return savedOffer;
  }

  async findAll(page = 1, limit = 10) {
    const [offers, total] = await this.offerRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['produce', 'buyer'],
      order: { createdAt: 'DESC' },
    });

    return {
      items: offers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
} 