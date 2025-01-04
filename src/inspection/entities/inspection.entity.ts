import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Produce } from '../../produce/entities/produce.entity';
import { User } from '../../auth/entities/user.entity';
import { Quality } from '../../quality/entities/quality.entity';

export enum InspectionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum InspectionMethod {
  MANUAL = 'MANUAL',
  AI = 'AI',
}

export interface DeviceInfo {
  type: string;
  model: string;
  os: string;
}

export interface EnvironmentalFactors {
  temperature?: number;
  humidity?: number;
  lighting?: string;
}

export interface ImageAnalysis {
  imageUrls: string[];
  resolution?: string;
  format?: string;
}

export interface InspectionMetadata {
  deviceInfo: DeviceInfo;
  environmentalFactors?: EnvironmentalFactors;
  imageAnalysis?: ImageAnalysis;
}

@Entity()
export class Inspection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  produceId: string;

  @ManyToOne(() => Produce)
  @JoinColumn({ name: 'produceId' })
  produce: Produce;

  @Column({ nullable: true })
  inspectorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inspectorId' })
  inspector: User;

  @Column({ nullable: true })
  qualityId: string;

  @ManyToOne(() => Quality)
  @JoinColumn({ name: 'qualityId' })
  quality: Quality;

  @Column({
    type: 'enum',
    enum: InspectionStatus,
    default: InspectionStatus.PENDING,
  })
  status: InspectionStatus;

  @Column({
    type: 'enum',
    enum: InspectionMethod,
    default: InspectionMethod.MANUAL,
  })
  method: InspectionMethod;

  @Column('jsonb', { nullable: true })
  metadata: InspectionMetadata;

  @Column('jsonb', { nullable: true })
  aiResults: any;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 