import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Produce } from '../produce.entity';

@Entity('fibers')
export class Fibers {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for fiber details' })
  id: string;

  @OneToOne(() => Produce, produce => produce.fibers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @Column({ type: 'decimal', precision: 5, scale: 2, transformer: { to: (value) => value, from: (value) => parseFloat(value) } })
  @ApiProperty({ description: 'Fiber strength in g/tex' })
  fiberStrength: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, transformer: { to: (value) => value, from: (value) => parseFloat(value) } })
  @ApiProperty({ description: 'Staple length in millimeters' })
  stapleLength: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, transformer: { to: (value) => value, from: (value) => parseFloat(value) } })
  @ApiProperty({ description: 'Trash content percentage' })
  trashContent: number;
} 