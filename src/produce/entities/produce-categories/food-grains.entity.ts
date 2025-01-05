import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Produce } from '../produce.entity';

@Entity('food_grains')
export class FoodGrains {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for food grain details' })
  id: string;

  @OneToOne(() => Produce, produce => produce.foodGrains, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @Column({ type: 'varchar' })
  @ApiProperty({ description: 'Variety of the food grain (e.g., Basmati Rice)' })
  variety: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, transformer: { to: (value) => value, from: (value) => parseFloat(value) } })
  @ApiProperty({ description: 'Moisture content percentage' })
  moistureContent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, transformer: { to: (value) => value, from: (value) => parseFloat(value) } })
  @ApiProperty({ description: 'Foreign matter percentage' })
  foreignMatter: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, transformer: { to: (value) => value, from: (value) => parseFloat(value) } })
  @ApiProperty({ description: 'Protein content percentage (for pulses)', required: false })
  proteinContent: number;
} 