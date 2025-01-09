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
      if (!buyer.location) return false;
      const [buyerLat, buyerLng] = buyer.location.split('-').map(coord => parseFloat(coord));
      
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
} 