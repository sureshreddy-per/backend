import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Produce } from '../../produce/entities/produce.entity';
import { User } from '../../users/entities/user.entity';

export enum InspectionRequestStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

@Entity('inspection_requests')
export class InspectionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'produce_id' })
  produce_id: string;

  @Column({ name: 'requester_id' })
  requester_id: string;

  @Column({ name: 'inspector_id', nullable: true })
  inspector_id: string;

  @Column({
    type: 'enum',
    enum: InspectionRequestStatus,
    default: InspectionRequestStatus.PENDING
  })
  status: InspectionRequestStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  inspection_fee: number;

  @Column({ type: 'jsonb', nullable: true })
  inspection_result: {
    quality_grade?: number;
    defects?: string[];
    recommendations?: string[];
    images?: string[];
    notes?: string;
  };

  @Column({ type: 'timestamp', nullable: true })
  scheduled_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Produce)
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inspector_id' })
  inspector: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 