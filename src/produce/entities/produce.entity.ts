import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Farmer } from '../../farmers/entities/farmer.entity';
import { Farm } from '../../farmers/entities/farm.entity';
import { QualityAssessment } from '../../quality/entities/quality-assessment.entity';

export enum ProduceCategory {
  FOOD_GRAINS = 'Food Grains',
  OILSEEDS = 'Oilseeds',
  FRUITS = 'Fruits',
  VEGETABLES = 'Vegetables',
  SPICES = 'Spices',
  FIBERS = 'Fibers',
  SUGARCANE = 'Sugarcane',
  FLOWERS = 'Flowers',
  MEDICINAL = 'Medicinal and Aromatic Plants'
}

export enum ProduceStatus {
  AVAILABLE = 'AVAILABLE',
  PENDING_INSPECTION = 'PENDING_INSPECTION',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  SOLD = 'SOLD',
  CANCELLED = 'CANCELLED'
}

@Entity('produce')
export class Produce {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'farmer_id' })
  farmer_id: string;

  @Column({ name: 'farm_id', nullable: true })
  farm_id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ProduceCategory
  })
  produce_category: ProduceCategory;

  @Column('decimal')
  quantity: number;

  @Column()
  unit: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price_per_unit: number;

  @Column({ nullable: true })
  location: string;

  @Column('text', { array: true, nullable: true })
  images: string[];

  @Column({
    type: 'enum',
    enum: ProduceStatus,
    default: ProduceStatus.AVAILABLE
  })
  status: ProduceStatus;

  @Column({ type: 'timestamp', nullable: true })
  harvested_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiry_date: Date;

  @Column({ nullable: true })
  quality_grade: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @Column({ type: 'varchar', nullable: true })
  video_url: string;

  @Column({ name: 'assigned_inspector', nullable: true })
  assigned_inspector: string;

  @ManyToOne(() => Farmer)
  @JoinColumn({ name: 'farmer_id' })
  farmer: Farmer;

  @ManyToOne(() => Farm)
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  // Reverse relationships
  @OneToMany(() => QualityAssessment, assessment => assessment.produce)
  quality_assessments: QualityAssessment[];
} 