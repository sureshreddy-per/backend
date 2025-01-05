import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Produce } from '../produce.entity';

@Entity('flowers')
export class Flowers {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for flower details' })
  id: string;

  @OneToOne(() => Produce, produce => produce.flowers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @Column({ type: 'varchar' })
  @ApiProperty({ description: 'Freshness level (fresh, slightly wilted)' })
  freshnessLevel: string;

  @Column({ type: 'varchar' })
  @ApiProperty({ description: 'Fragrance quality (strong, mild)' })
  fragranceQuality: string;

  @Column({ type: 'decimal', precision: 6, scale: 2, transformer: { to: (value) => value, from: (value) => parseFloat(value) } })
  @ApiProperty({ description: 'Stem length in centimeters' })
  stemLength: number;
} 