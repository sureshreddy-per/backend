import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Farmer } from '../../farmers/entities/farmer.entity';
import { QualityAssessment } from '../../quality/entities/quality-assessment.entity';
import { ProduceType } from '../dto/produce-filter.dto';

@Entity()
export class Produce {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ProduceType,
    default: ProduceType.OTHER
  })
  type: ProduceType;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 6 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 6 })
  longitude: number;

  @ManyToOne(() => Farmer, farmer => farmer.produce)
  farmer: Farmer;

  @OneToOne(() => QualityAssessment, assessment => assessment.produce)
  qualityAssessment: QualityAssessment;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 