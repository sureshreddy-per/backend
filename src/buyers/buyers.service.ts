import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Buyer } from './entities/buyer.entity';
import { UsersService } from '../users/users.service';
import { UpdateBuyerDetailsDto } from './dto/update-buyer-details.dto';

@Injectable()
export class BuyersService {
  constructor(
    @InjectRepository(Buyer)
    private buyersRepository: Repository<Buyer>,
    private usersService: UsersService,
  ) {}

  async createBuyer(userId: string, createBuyerDto: Partial<Buyer>): Promise<Buyer> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingBuyer = await this.buyersRepository.findOne({
      where: { user_id: userId },
    });
    if (existingBuyer) {
      throw new ConflictException('Buyer profile already exists');
    }

    const buyer = this.buyersRepository.create({
      ...createBuyerDto,
      user_id: userId,
    });
    return this.buyersRepository.save(buyer);
  }

  async findAll(): Promise<Buyer[]> {
    return this.buyersRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: string): Promise<Buyer> {
    const buyer = await this.buyersRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }
    return buyer;
  }

  async findByUserId(userId: string): Promise<Buyer> {
    const buyer = await this.buyersRepository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });
    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }
    return buyer;
  }

  async update(id: string, updateBuyerDto: Partial<Buyer>): Promise<Buyer> {
    const buyer = await this.findOne(id);
    await this.buyersRepository.update(id, updateBuyerDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const buyer = await this.findOne(id);
    await this.buyersRepository.remove(buyer);
  }

  async findNearbyBuyers(lat: number, lng: number, radiusKm: number = 50): Promise<Buyer[]> {
    // Use Haversine formula in raw SQL with lat_lng string parsing
    const buyers = await this.buyersRepository
      .createQueryBuilder('buyer')
      .select('buyer.*')
      .addSelect(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(CAST(SPLIT_PART(buyer.lat_lng, '-', 1) AS FLOAT))) *
            cos(radians(CAST(SPLIT_PART(buyer.lat_lng, '-', 2) AS FLOAT)) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(CAST(SPLIT_PART(buyer.lat_lng, '-', 1) AS FLOAT)))
          )
        )`,
        'distance'
      )
      .where(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(CAST(SPLIT_PART(buyer.lat_lng, '-', 1) AS FLOAT))) *
            cos(radians(CAST(SPLIT_PART(buyer.lat_lng, '-', 2) AS FLOAT)) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(CAST(SPLIT_PART(buyer.lat_lng, '-', 1) AS FLOAT)))
          )
        ) <= :radius`,
        { lat, lng, radius: radiusKm }
      )
      .andWhere('buyer.lat_lng IS NOT NULL')
      .orderBy('distance', 'ASC')
      .leftJoinAndSelect('buyer.user', 'user')
      .getRawAndEntities();

    return buyers.entities;
  }

  async validateBuyer(id: string): Promise<boolean> {
    const buyer = await this.buyersRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    return !!buyer && buyer.user.status === 'ACTIVE';
  }

  async findByPriceRange(price: number): Promise<Buyer[]> {
    return this.buyersRepository
      .createQueryBuilder('buyer')
      .leftJoinAndSelect('buyer.user', 'user')
      .where('(:price >= buyer.min_price OR buyer.min_price IS NULL)', { price })
      .andWhere('(:price <= buyer.max_price OR buyer.max_price IS NULL)', { price })
      .getMany();
  }

  async getBuyerDetails(userId: string): Promise<any> {
    const buyer = await this.buyersRepository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });
    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }

    const user = buyer.user;
    return {
      address: buyer.address,
      lat_lng: buyer.lat_lng,
      registration_number: buyer.registration_number,
      business_name: buyer.business_name,
      gst: buyer.gst,
      email: user.email,
      profile_picture: user.profile_picture,
      name: user.name,
      status: user.status,
    };
  }

  async updateBuyerDetails(userId: string, updateBuyerDetailsDto: UpdateBuyerDetailsDto): Promise<any> {
    const buyer = await this.buyersRepository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });
    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }

    // Only update the fields that are provided
    const updateData: Partial<Buyer> = {};
    if (updateBuyerDetailsDto.address !== undefined) {
      updateData.address = updateBuyerDetailsDto.address;
    }
    if (updateBuyerDetailsDto.lat_lng !== undefined) {
      updateData.lat_lng = updateBuyerDetailsDto.lat_lng;
    }
    if (updateBuyerDetailsDto.registration_number !== undefined) {
      updateData.registration_number = updateBuyerDetailsDto.registration_number;
    }
    if (updateBuyerDetailsDto.business_name !== undefined) {
      updateData.business_name = updateBuyerDetailsDto.business_name;
    }
    if (updateBuyerDetailsDto.gst !== undefined) {
      updateData.gst = updateBuyerDetailsDto.gst;
    }

    await this.buyersRepository.update(buyer.id, updateData);
    
    const updatedBuyer = await this.buyersRepository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });

    const user = updatedBuyer.user;
    return {
      address: updatedBuyer.address,
      lat_lng: updatedBuyer.lat_lng,
      registration_number: updatedBuyer.registration_number,
      business_name: updatedBuyer.business_name,
      gst: updatedBuyer.gst,
      email: user.email,
      profile_picture: user.profile_picture,
      name: user.name,
      status: user.status,
    };
  }

  async getBuyerDetailsByOfferId(offerId: string, farmerId: string): Promise<any> {
    const buyer = await this.buyersRepository
      .createQueryBuilder('buyer')
      .innerJoinAndSelect('buyer.user', 'user')
      .innerJoin('offers', 'offer', 'offer.buyer_id = buyer.id')
      .innerJoin('produce', 'produce', 'offer.produce_id = produce.id')
      .where('offer.id = :offerId', { offerId })
      .andWhere('produce.farmer_id = :farmerId', { farmerId })
      .getOne();

    if (!buyer) {
      throw new UnauthorizedException('You do not have access to this buyer\'s details or the offer does not exist');
    }

    const user = buyer.user;
    return {
      address: buyer.address,
      lat_lng: buyer.lat_lng,
      registration_number: buyer.registration_number,
      business_name: buyer.business_name,
      gst: buyer.gst,
      email: user.email,
      profile_picture: user.profile_picture,
      name: user.name,
      status: user.status,
    };
  }
} 