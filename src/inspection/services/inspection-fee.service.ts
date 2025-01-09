import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InspectionBaseFee } from '../entities/inspection-base-fee.entity';
import { InspectionDistanceFee } from '../entities/inspection-distance-fee.entity';
import { ProduceService } from '../../produce/services/produce.service';
import { ConfigService } from '@nestjs/config';
import { ProduceCategory } from '../../produce/enums/produce-category.enum';
import { Equal } from 'typeorm';

@Injectable()
export class InspectionFeeService {
  constructor(
    @InjectRepository(InspectionBaseFee)
    private readonly baseFeeRepository: Repository<InspectionBaseFee>,
    @InjectRepository(InspectionDistanceFee)
    private readonly distanceFeeRepository: Repository<InspectionDistanceFee>,
    private readonly produceService: ProduceService,
    private readonly configService: ConfigService,
  ) {}

  async calculateInspectionFee(data: {
    produce_id: string;
    location: string;
  }): Promise<number> {
    const produce = await this.produceService.findOne(data.produce_id);
    if (!produce) {
      throw new NotFoundException('Produce not found');
    }

    // Get base fee for the produce category
    const baseFee = await this.baseFeeRepository.findOne({
      where: {
        produce_category: produce.produce_category as any,
        is_active: true
      },
    });

    if (!baseFee) {
      throw new NotFoundException(`No base fee configured for produce category: ${produce.produce_category}`);
    }

    // Calculate distance from the inspection center
    const inspectionCenterLocation = this.configService.get('INSPECTION_CENTER_LOCATION');
    if (!inspectionCenterLocation) {
      throw new NotFoundException('Inspection center location not configured');
    }

    const distance = this.calculateDistance(
      inspectionCenterLocation,
      data.location,
    );

    // Get distance-based fee
    const distanceFee = await this.distanceFeeRepository.findOne({
      where: {
        min_distance: distance <= 50 ? 0 : 50,
        max_distance: distance <= 50 ? 50 : 100,
        is_active: true,
      },
    });

    if (!distanceFee) {
      throw new NotFoundException(`No distance fee configured for distance: ${distance}km`);
    }

    // Calculate total fee
    return baseFee.base_fee + distanceFee.fee;
  }

  async updateBaseFee(
    produce_category: ProduceCategory,
    base_fee: number,
    updated_by: string,
  ): Promise<InspectionBaseFee> {
    // Deactivate current active fee for this category
    await this.baseFeeRepository.update(
      { produce_category, is_active: true },
      { is_active: false },
    );

    // Create new active fee
    const newFee = this.baseFeeRepository.create({
      produce_category,
      base_fee,
      is_active: true,
      updated_by,
    });

    return this.baseFeeRepository.save(newFee);
  }

  async updateDistanceFee(
    min_distance: number,
    max_distance: number,
    fee: number,
    updated_by: string,
  ): Promise<InspectionDistanceFee> {
    // Deactivate current active fee for this range
    await this.distanceFeeRepository.update(
      { min_distance, max_distance, is_active: true },
      { is_active: false },
    );

    // Create new active fee
    const newFee = this.distanceFeeRepository.create({
      min_distance,
      max_distance,
      fee,
      is_active: true,
      updated_by,
    });

    return this.distanceFeeRepository.save(newFee);
  }

  private calculateDistance(location1: string, location2: string): number {
    // Convert location strings to lat-lon pairs
    const [lat1, lon1] = location1.split('-').map(Number);
    const [lat2, lon2] = location2.split('-').map(Number);

    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}