import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProduceCategory } from '../../produce/enums/produce-category.enum';
import { Produce } from '../../produce/entities/produce.entity';

@Entity('quality_assessments')
export class QualityAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  produce_id: string;

  @Column({ type: 'text' })
  produce_name: string;

  @Column({ type: 'enum', enum: ProduceCategory })
  category: ProduceCategory;

  @Column({ type: 'float' })
  quality_grade: number;

  @Column({ type: 'float' })
  confidence_level: number;

  @Column({ type: 'text', array: true, default: '{}' })
  defects: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  recommendations: string[];

  @Column({ type: 'jsonb', nullable: true })
  category_specific_assessment: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => Produce, produce => produce.quality_assessments)
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;
}
