import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Buyer } from './entities/buyer.entity';

@Injectable()
export class BuyersService {
  constructor(
    @InjectRepository(Buyer)
    private readonly buyerRepository: Repository<Buyer>,
  ) {}

  async findByPriceRange(price: number): Promise<Buyer[]> {
    return this.buyerRepository.find();
  }

  async findNearby(location: string, radiusKm: number): Promise<Buyer[]> {
    const [lat, lng] = location.split('-').map(coord => parseFloat(coord));
    const buyers = await this.buyerRepository.find();

    return buyers.filter(buyer => {
      if (!buyer.lat_lng) return false;
      const [buyerLat, buyerLng] = buyer.lat_lng.split('-').map(coord => parseFloat(coord));

      const R = 6371; // Earth's radius in km
      const dLat = this.toRad(buyerLat - lat);
      const dLon = this.toRad(buyerLng - lng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.toRad(lat)) *
          Math.cos(this.toRad(buyerLat)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return distance <= radiusKm;
    });
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async createBuyer(user_id: string, buyerData: Partial<Buyer>): Promise<Buyer> {
    const buyer = this.buyerRepository.create({
      user_id,
      ...buyerData,
      is_active: true
    });
    return this.buyerRepository.save(buyer);
  }

  async findByUserId(userId: string): Promise<Buyer> {
    return this.buyerRepository.findOne({ where: { user_id: userId } });
  }

  async findOne(id: string): Promise<Buyer> {
    return this.buyerRepository.findOne({ where: { id } });
  }

  async findNearbyBuyers(lat: number, lng: number, radiusKm: number): Promise<Buyer[]> {
    try {
      console.log(`Finding buyers near lat: ${lat}, lng: ${lng}, radius: ${radiusKm}km`);

      // Using raw SQL with Haversine formula for better performance
      const buyers = await this.buyerRepository
        .createQueryBuilder('buyer')
        .where('buyer.is_active = :isActive', { isActive: true })
        .andWhere('buyer.lat_lng IS NOT NULL')
        .andWhere(
          `(
            6371 * 2 * asin(
              sqrt(
                power(sin((:lat * pi() / 180 - CAST(split_part(buyer.lat_lng, '-', 1) AS float) * pi() / 180) / 2), 2) +
                  cos(:lat * pi() / 180) * cos(CAST(split_part(buyer.lat_lng, '-', 1) AS float) * pi() / 180) *
                  power(sin((:lng * pi() / 180 - CAST(split_part(buyer.lat_lng, '-', 2) AS float) * pi() / 180) / 2), 2)
                )
              )
            ) <= :radiusKm`,
            { lat, lng, radiusKm }
          )
          .orderBy(
            `(
              6371 * 2 * asin(
                sqrt(
                  power(sin((:lat * pi() / 180 - CAST(split_part(buyer.lat_lng, '-', 1) AS float) * pi() / 180) / 2), 2) +
                    cos(:lat * pi() / 180) * cos(CAST(split_part(buyer.lat_lng, '-', 1) AS float) * pi() / 180) *
                    power(sin((:lng * pi() / 180 - CAST(split_part(buyer.lat_lng, '-', 2) AS float) * pi() / 180) / 2), 2)
                  )
                )
              )`,
              'ASC'
            )
            .getMany();

      console.log(`Found ${buyers.length} buyers within ${radiusKm}km radius`);
      return buyers;
    } catch (error) {
      console.error('Error in findNearbyBuyers:', error);
      throw error;
    }
  }

  async getBuyerDetails(userId: string): Promise<Buyer> {
    return this.findByUserId(userId);
  }

  async updateBuyerDetails(userId: string, updateData: Partial<Buyer>): Promise<Buyer> {
    const buyer = await this.findByUserId(userId);
    Object.assign(buyer, updateData);
    return this.buyerRepository.save(buyer);
  }

  async getBuyerDetailsByOfferId(offerId: string, userId: string): Promise<Buyer> {
    // First find the buyer associated with this offer
    const buyer = await this.buyerRepository
      .createQueryBuilder('buyer')
      .innerJoin('buyer.offers', 'offer', 'offer.id = :offerId', { offerId })
      .where('buyer.user_id = :userId', { userId })
      .getOne();

    return buyer;
  }
}