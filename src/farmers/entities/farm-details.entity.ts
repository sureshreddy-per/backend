import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Farmer } from './farmer.entity';
import { Produce } from '../../produce/entities/produce.entity';

@Entity('farm_details')
export class FarmDetails {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for farm details' })
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @ApiProperty({ description: 'Farm size' })
  size: number;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Farm size unit' })
  sizeUnit: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Farm name or identifier' })
  name: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Farm address or location description' })
  address: string;

  @Column('jsonb', { nullable: true })
  @ApiProperty({ description: 'Farm location coordinates' })
  location: {
    lat: number;
    lng: number;
  };

  @ManyToOne(() => Farmer, farmer => farmer.farms)
  farmer: Farmer;

  @Column()
  farmerId: string;

  @OneToMany(() => Produce, produce => produce.farm)
  @ApiProperty({ description: 'Produce listings from this farm', type: [Produce] })
  produce: Produce[];

  @CreateDateColumn()
  @ApiProperty({ description: 'When the farm details were created' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'When the farm details were last updated' })
  updatedAt: Date;
} 