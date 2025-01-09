import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ProduceCategory } from '../../produce/enums/produce-category.enum';

@Entity('inspection_base_fees')
export class InspectionBaseFee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ProduceCategory
  })
  produce_category: ProduceCategory;

  @Column('decimal', {
    precision: 10,
    scale: 2
  })
  base_fee: number;

  @Column({
    default: true
  })
  is_active: boolean;

  @Column({
    nullable: true
  })
  updated_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 