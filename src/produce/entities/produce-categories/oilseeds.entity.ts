import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Produce } from '../produce.entity';

@Entity('oilseeds')
export class Oilseeds {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for oilseed details' })
  id: string;

  @OneToOne(() => Produce, produce => produce.oilseeds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @Column({ type: 'decimal', precision: 5, scale: 2, transformer: { to: (value) => value, from: (value) => parseFloat(value) } })
  @ApiProperty({ description: 'Oil content percentage' })
  oilContent: number;

  @Column({ type: 'varchar' })
  @ApiProperty({ description: 'Size of the seeds (small, medium, large)' })
  seedSize: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, transformer: { to: (value) => value, from: (value) => parseFloat(value) } })
  @ApiProperty({ description: 'Moisture content percentage' })
  moistureContent: number;
} 