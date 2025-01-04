import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Produce } from '../../produce/entities/produce.entity';
import { QualityGrade } from '../../produce/dto/produce-filter.dto';

@Entity()
export class QualityAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Produce, produce => produce.qualityAssessment)
  @JoinColumn()
  produce: Produce;

  @Column({
    type: 'enum',
    enum: QualityGrade,
    default: QualityGrade.PENDING
  })
  grade: QualityGrade;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    moisture?: number;
    purity?: number;
    damage?: number;
    foreignMatter?: number;
    notes?: string;
  };

  @Column({ nullable: true })
  inspectorId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 