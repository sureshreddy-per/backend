import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Farmer } from '../../farmers/entities/farmer.entity';
import { Farm } from '../../farmers/entities/farm.entity';

export enum ProduceCategory {
  FOOD_GRAINS = 'FOOD_GRAINS',
  OILSEEDS = 'OILSEEDS',
  FRUITS = 'FRUITS',
  VEGETABLES = 'VEGETABLES',
  SPICES = 'SPICES',
  FIBERS = 'FIBERS',
  SUGARCANE = 'SUGARCANE',
  FLOWERS = 'FLOWERS',
  MEDICINAL_AND_AROMATIC_PLANTS = 'MEDICINAL_AND_AROMATIC_PLANTS',
}

export enum ProduceStatus {
  AVAILABLE = 'available',
  IN_PROGRESS = 'in_progress',
  SOLD = 'sold',
  RESERVED = 'reserved',
  EXPIRED = 'expired',
  REMOVED = 'removed',
}

@Entity('produce')
export class Produce {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty({ enum: ProduceCategory })
  @Column({
    type: 'enum',
    enum: ProduceCategory,
  })
  category: ProduceCategory;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2, name: 'price_per_unit' })
  price_per_unit: number;

  @ApiProperty()
  @Column()
  unit: string;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2, name: 'available_quantity' })
  quantity: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({ type: [String], required: false })
  @Column('simple-array', { nullable: true })
  images?: string[];

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  video?: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true, name: 'produce_tag' })
  produce_tag?: string;

  @ApiProperty({ enum: ProduceStatus })
  @Column({
    type: 'enum',
    enum: ProduceStatus,
    default: ProduceStatus.AVAILABLE,
  })
  status: ProduceStatus;

  @ApiProperty({ required: false })
  @Column({ nullable: true, name: 'quality_grade' })
  quality_grade?: string;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 8 })
  latitude: number;

  @ApiProperty()
  @Column('decimal', { precision: 11, scale: 8 })
  longitude: number;

  @ApiProperty()
  @Column({ name: 'farmer_id' })
  farmer_id: string;

  @ApiProperty({ type: () => Farmer })
  @ManyToOne(() => Farmer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmer_id' })
  farmer: Farmer;

  @ApiProperty({ required: false })
  @Column({ name: 'farm_id', nullable: true })
  farm_id?: string;

  @ApiProperty({ type: () => Farm, required: false })
  @ManyToOne(() => Farm, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'farm_id' })
  farm?: Farm;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
} 