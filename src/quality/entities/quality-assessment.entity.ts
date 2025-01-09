import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Produce } from '../../produce/entities/produce.entity';

export enum AssessmentSource {
  AI = 'AI',
  MANUAL_INSPECTION = 'MANUAL_INSPECTION'
}

@Entity('quality_assessments')
export class QualityAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'produce_id' })
  produce_id: string;

  @Column({
    type: 'enum',
    enum: AssessmentSource,
    default: AssessmentSource.AI
  })
  source: AssessmentSource;

  @Column('int')
  quality_grade: number;

  @Column('decimal', { precision: 5, scale: 2 })
  confidence_level: number;

  @Column('text', { array: true, nullable: true })
  defects: string[];

  @Column('text', { array: true, nullable: true })
  recommendations: string[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  category_specific_assessment: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    inspector_id?: string;
    inspection_id?: string;
    ai_model_version?: string;
    assessment_parameters?: Record<string, any>;
    images?: string[];
  };

  @ManyToOne(() => Produce)
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 