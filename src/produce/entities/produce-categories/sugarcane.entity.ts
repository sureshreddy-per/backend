import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Produce } from '../produce.entity';

@Entity('sugarcane')
export class Sugarcane {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for sugarcane details' })
  id: string;

  @OneToOne(() => Produce, produce => produce.sugarcane, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @Column({ type: 'varchar' })
  @ApiProperty({ description: 'Variety of sugarcane (e.g., Co-0238)' })
  variety: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, transformer: { to: (value) => value, from: (value) => parseFloat(value) } })
  @ApiProperty({ description: 'Brix content (sugar percentage)' })
  brixContent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, transformer: { to: (value) => value, from: (value) => parseFloat(value) } })
  @ApiProperty({ description: 'Fiber content percentage' })
  fiberContent: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, transformer: { to: (value) => value, from: (value) => parseFloat(value) } })
  @ApiProperty({ description: 'Stalk length in centimeters' })
  stalkLength: number;
} 