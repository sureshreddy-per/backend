import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Produce } from '../produce.entity';

@Entity('vegetables')
export class Vegetables {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for vegetable details' })
  id: string;

  @OneToOne(() => Produce, produce => produce.vegetables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @Column({ type: 'varchar' })
  @ApiProperty({ description: 'Freshness level (fresh, moderately fresh)' })
  freshnessLevel: string;

  @Column({ type: 'varchar' })
  @ApiProperty({ description: 'Size of the vegetable (small, medium, large)' })
  size: string;

  @Column({ type: 'varchar' })
  @ApiProperty({ description: 'Color of the vegetable' })
  color: string;
} 