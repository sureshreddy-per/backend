import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Farmer } from '../../farmers/entities/farmer.entity';
import { Offer } from '../../offers/entities/offer.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { QualityAssessment } from '../../quality/entities/quality-assessment.entity';
import { FarmDetails } from '../../farmers/entities/farm-details.entity';
import { FoodGrains } from './produce-categories/food-grains.entity';
import { Oilseeds } from './produce-categories/oilseeds.entity';
import { Fruits } from './produce-categories/fruits.entity';
import { Vegetables } from './produce-categories/vegetables.entity';
import { Spices } from './produce-categories/spices.entity';
import { Fibers } from './produce-categories/fibers.entity';
import { Sugarcane } from './produce-categories/sugarcane.entity';
import { Flowers } from './produce-categories/flowers.entity';
import { MedicinalPlants } from './produce-categories/medicinal-plants.entity';

export enum ProduceStatus {
  AVAILABLE = 'AVAILABLE',
  IN_PROGRESS = 'IN_PROGRESS',
  SOLD = 'SOLD',
  CANCELLED = 'CANCELLED'
}

export enum ProduceCategory {
  FOOD_GRAINS = 'FOOD_GRAINS',
  OILSEEDS = 'OILSEEDS',
  FRUITS = 'FRUITS',
  VEGETABLES = 'VEGETABLES',
  SPICES = 'SPICES',
  FIBERS = 'FIBERS',
  SUGARCANE = 'SUGARCANE',
  FLOWERS = 'FLOWERS',
  MEDICINAL_PLANTS = 'MEDICINAL_PLANTS'
}

@Entity('produces')
export class Produce {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for produce' })
  id: string;

  @Column()
  @ApiProperty({ description: 'ID of the farmer who listed this produce' })
  farmerId: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'ID of the farm where this produce was grown', required: false })
  farmId: string;

  @Column()
  @ApiProperty({ description: 'Name of the produce' })
  name: string;

  @Column()
  @ApiProperty({ description: 'Description of the produce' })
  description: string;

  @Column('decimal', { precision: 10, scale: 2, transformer: { to: (value) => value, from: (value) => parseFloat(value) } })
  @ApiProperty({ description: 'Quantity of the produce' })
  quantity: number;

  @Column()
  @ApiProperty({ description: 'Unit of measurement for the quantity' })
  unit: string;

  @Column('decimal', { precision: 10, scale: 2, transformer: { to: (value) => value, from: (value) => parseFloat(value) } })
  @ApiProperty({ description: 'Total price for the produce' })
  price: number;

  @Column('decimal', { precision: 10, scale: 2, transformer: { to: (value) => value, from: (value) => parseFloat(value) } })
  @ApiProperty({ description: 'Price per unit of the produce' })
  pricePerUnit: number;

  @Column()
  @ApiProperty({ description: 'Currency of the price' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ProduceStatus,
    default: ProduceStatus.AVAILABLE
  })
  @ApiProperty({ description: 'Current status of the produce listing', enum: ProduceStatus })
  status: ProduceStatus;

  @Column({
    type: 'enum',
    enum: ProduceCategory
  })
  @ApiProperty({ description: 'Category of the produce', enum: ProduceCategory })
  category: ProduceCategory;

  @Column('json')
  @ApiProperty({ description: 'Location coordinates of the produce' })
  location: {
    latitude: number;
    longitude: number;
  };

  @Column({ nullable: true })
  @ApiProperty({ description: 'Quality grade of the produce', required: false })
  qualityGrade: string;

  @Column('json', { nullable: true })
  @ApiProperty({ description: 'Additional metadata for the produce', required: false })
  metadata?: Record<string, any>;

  @Column('text', { array: true, default: [] })
  @ApiProperty({ type: [String], description: 'Array of image URLs' })
  imageUrls: string[];

  @Column({ nullable: true })
  @ApiProperty({ description: 'Primary image URL for the produce' })
  primaryImageUrl: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'URL of the video file' })
  videoUrl?: string;

  @ManyToOne(() => Farmer, farmer => farmer.produce)
  @ApiProperty({ description: 'Farmer who listed this produce', type: () => Farmer })
  farmer: Farmer;

  @ManyToOne(() => FarmDetails, farm => farm.produce)
  @ApiProperty({ description: 'Farm where this produce was grown', type: () => FarmDetails })
  farm: FarmDetails;

  @OneToMany(() => Offer, offer => offer.produce)
  @ApiProperty({ description: 'Offers made for this produce', type: [Offer] })
  offers: Offer[];

  @OneToMany(() => Transaction, transaction => transaction.produce)
  @ApiProperty({ description: 'Transactions involving this produce', type: [Transaction] })
  transactions: Transaction[];

  @OneToOne(() => QualityAssessment, assessment => assessment.produce)
  @ApiProperty({ description: 'Quality assessment details', type: () => QualityAssessment })
  qualityAssessment: QualityAssessment;

  @OneToOne(() => FoodGrains, foodGrains => foodGrains.produce)
  @ApiProperty({ description: 'Food grain specific details', type: () => FoodGrains, required: false })
  foodGrains: FoodGrains;

  @OneToOne(() => Oilseeds, oilseeds => oilseeds.produce)
  @ApiProperty({ description: 'Oilseed specific details', type: () => Oilseeds, required: false })
  oilseeds: Oilseeds;

  @OneToOne(() => Fruits, fruits => fruits.produce)
  @ApiProperty({ description: 'Fruit specific details', type: () => Fruits, required: false })
  fruits: Fruits;

  @OneToOne(() => Vegetables, vegetables => vegetables.produce)
  @ApiProperty({ description: 'Vegetable specific details', type: () => Vegetables, required: false })
  vegetables: Vegetables;

  @OneToOne(() => Spices, spices => spices.produce)
  @ApiProperty({ description: 'Spice specific details', type: () => Spices, required: false })
  spices: Spices;

  @OneToOne(() => Fibers, fibers => fibers.produce)
  @ApiProperty({ description: 'Fiber specific details', type: () => Fibers, required: false })
  fibers: Fibers;

  @OneToOne(() => Sugarcane, sugarcane => sugarcane.produce)
  @ApiProperty({ description: 'Sugarcane specific details', type: () => Sugarcane, required: false })
  sugarcane: Sugarcane;

  @OneToOne(() => Flowers, flowers => flowers.produce)
  @ApiProperty({ description: 'Flower specific details', type: () => Flowers, required: false })
  flowers: Flowers;

  @OneToOne(() => MedicinalPlants, medicinalPlants => medicinalPlants.produce)
  @ApiProperty({ description: 'Medicinal plant specific details', type: () => MedicinalPlants, required: false })
  medicinalPlants: MedicinalPlants;

  @CreateDateColumn()
  @ApiProperty({ description: 'When the produce listing was created' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'When the produce listing was last updated' })
  updatedAt: Date;
} 