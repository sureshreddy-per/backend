import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Produce } from '../../produce/entities/produce.entity';
import { QualityGrade } from '../../produce/enums/quality-grade.enum';
import { QualityMetadata, QualityCriteria } from '../dto/create-quality.dto';

@Entity()
export class Quality {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  produceId: string;

  @ManyToOne(() => Produce)
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @Column({
    type: 'enum',
    enum: QualityGrade,
    default: QualityGrade.PENDING
  })
  grade: QualityGrade;

  @Column('json')
  criteria: QualityCriteria;

  @Column('json', { nullable: true })
  metadata: QualityMetadata;

  @Column()
  assessedBy: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
} 