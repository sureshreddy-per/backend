import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Produce } from '../../produce/entities/produce.entity';
import { User } from '../../users/entities/user.entity';
import { QualityGrade } from '../../produce/enums/quality-grade.enum';

export enum InspectionMethod {
  VISUAL = 'VISUAL',
  AI_ASSISTED = 'AI_ASSISTED',
  LABORATORY = 'LABORATORY'
}

@Entity('quality_assessments')
export class QualityAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  produce_id: string;

  @ManyToOne(() => Produce)
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @Column({ type: 'uuid', nullable: true })
  inspector_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'inspector_id' })
  inspector: User;

  @Column({
    type: 'enum',
    enum: QualityGrade,
    nullable: true
  })
  grade: QualityGrade;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column('simple-array', { nullable: true })
  imageUrls: string[];

  @Column({
    type: 'enum',
    enum: InspectionMethod,
    default: InspectionMethod.VISUAL
  })
  method: InspectionMethod;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 