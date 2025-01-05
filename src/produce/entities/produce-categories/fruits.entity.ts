import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Produce } from '../produce.entity';

@Entity('fruits')
export class Fruits {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for fruit details' })
  id: string;

  @OneToOne(() => Produce, produce => produce.fruits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @Column({ type: 'decimal', precision: 5, scale: 2, transformer: { to: (value) => value, from: (value) => parseFloat(value) } })
  @ApiProperty({ description: 'Sweetness level in Brix' })
  sweetness: number;

  @Column({ type: 'varchar' })
  @ApiProperty({ description: 'Size of the fruit (small, medium, large)' })
  size: string;

  @Column({ type: 'varchar' })
  @ApiProperty({ description: 'Color of the fruit' })
  color: string;

  @Column({ type: 'varchar' })
  @ApiProperty({ description: 'Ripeness level (ripe, unripe)' })
  ripenessLevel: string;
} 