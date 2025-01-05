import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Produce } from '../produce.entity';

@Entity('medicinal_plants')
export class MedicinalPlants {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for medicinal plant details' })
  id: string;

  @OneToOne(() => Produce, produce => produce.medicinalPlants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @Column({ type: 'varchar' })
  @ApiProperty({ description: 'Part of plant used (leaf, root, bark, etc.)' })
  plantPart: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, transformer: { to: (value) => value, from: (value) => parseFloat(value) } })
  @ApiProperty({ description: 'Essential oil yield percentage' })
  essentialOilYield: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, transformer: { to: (value) => value, from: (value) => parseFloat(value) } })
  @ApiProperty({ description: 'Purity of extracts percentage' })
  purityOfExtracts: number;

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({ description: 'Processing method used', required: false })
  processingMethod?: string;
} 