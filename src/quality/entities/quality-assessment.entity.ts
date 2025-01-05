import { Entity, Column, PrimaryGeneratedColumn, OneToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Produce } from '../../produce/entities/produce.entity';

export enum QualityGrade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  REJECTED = 'REJECTED'
}

@Entity()
export class QualityAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Produce, produce => produce.qualityAssessment)
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @Column('uuid')
  produceId: string;

  @Column({
    type: 'enum',
    enum: QualityGrade,
    nullable: true
  })
  grade: QualityGrade;

  @Column('jsonb', { nullable: true })
  criteria: {
    appearance?: {
      color: number;
      texture: number;
      shape: number;
    };
    condition?: {
      freshness: number;
      ripeness: number;
      damage: number;
    };
    size?: {
      uniformity: number;
      marketStandard: number;
    };
  };

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  overallScore: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  inspectorId: string;

  @Column('jsonb', { nullable: true })
  images: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
} 