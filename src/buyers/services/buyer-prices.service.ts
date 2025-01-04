import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuyerPrice } from '../entities/buyer-price.entity';
import { CreateBuyerPriceDto } from '../dto/create-buyer-price.dto';
import { UpdateBuyerPriceDto } from '../dto/update-buyer-price.dto';
import { AutoOfferManagerService } from '../../offers/services/auto-offer-manager.service';

@Injectable()
export class BuyerPricesService {
  constructor(
    @InjectRepository(BuyerPrice)
    private readonly buyerPriceRepository: Repository<BuyerPrice>,
    private readonly autoOfferManager: AutoOfferManagerService
  ) {}

  async create(buyerId: string, createBuyerPriceDto: CreateBuyerPriceDto) {
    const buyerPrice = new BuyerPrice();
    Object.assign(buyerPrice, {
      ...createBuyerPriceDto,
      buyerId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return this.buyerPriceRepository.save(buyerPrice);
  }

  async findAll() {
    return this.buyerPriceRepository.find();
  }

  async findOne(id: string) {
    return this.buyerPriceRepository.findOne({
      where: { id }
    });
  }

  async update(id: string, updateBuyerPriceDto: UpdateBuyerPriceDto) {
    const buyerPrice = await this.findOne(id);
    if (!buyerPrice) return null;

    const oldPrice = buyerPrice.pricePerUnit;
    const newPrice = updateBuyerPriceDto.pricePerUnit || oldPrice;

    Object.assign(buyerPrice, {
      ...updateBuyerPriceDto,
      updatedAt: new Date()
    });

    const updatedBuyerPrice = await this.buyerPriceRepository.save(buyerPrice);

    // Trigger auto-offer updates for price change
    await this.autoOfferManager.updatePrice(
      buyerPrice.id,
      newPrice,
      'Price updated by buyer'
    );

    return updatedBuyerPrice;
  }

  async remove(id: string) {
    const buyerPrice = await this.findOne(id);
    if (buyerPrice) {
      await this.buyerPriceRepository.remove(buyerPrice);
    }
  }
} 