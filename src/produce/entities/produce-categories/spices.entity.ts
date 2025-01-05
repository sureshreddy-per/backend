import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Produce } from '../produce.entity';

@Entity('spices')
export class Spices {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for spice details' })
  id: string;

  @OneToOne(() => Produce, produce => produce.spices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @Column({ type: 'decimal', precision: 5, scale: 2, transformer: { to: (value) => value, from: (value) => parseFloat(value) } })
  @ApiProperty({ description: 'Volatile oil content percentage' })
  volatileOilContent: number;

  @Column({ type: 'varchar' })
  @ApiProperty({ description: 'Aroma quality (strong, mild)' })
  aromaQuality: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, transformer: { to: (value) => value, from: (value) => parseFloat(value) } })
  @ApiProperty({ description: 'Purity percentage' })
  purity: number;
} 