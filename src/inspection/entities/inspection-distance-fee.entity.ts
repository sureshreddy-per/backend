import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('inspection_distance_fees')
export class InspectionDistanceFee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int')
  min_distance: number;

  @Column('int')
  max_distance: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    comment: 'Fee for this distance range'
  })
  fee: number;

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