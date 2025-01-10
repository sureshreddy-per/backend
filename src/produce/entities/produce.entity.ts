import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Farmer } from '../../farmers/entities/farmer.entity';
import { Farm } from '../../farmers/entities/farm.entity';
import { QualityAssessment } from '../../quality/entities/quality-assessment.entity';
import { QualityGrade } from '../enums/quality-grade.enum';
import { ProduceCategory } from '../enums/produce-category.enum';
import { ProduceStatus } from '../enums/produce-status.enum';

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

  @Column({ nullable: true })
  product_variety: string;

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

  @Column({ nullable: true })
  location_name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  inspection_fee: number;

  @Column({ type: 'boolean', default: false })
  is_inspection_requested: boolean;

  @Column({ type: 'uuid', nullable: true })
  inspection_requested_by: string;

  @Column({ type: 'timestamp', nullable: true })
  inspection_requested_at: Date;

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

  @Column({
    type: 'enum',
    enum: QualityGrade,
    nullable: true
  })
  quality_grade: QualityGrade;

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