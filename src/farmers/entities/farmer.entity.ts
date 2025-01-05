import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BankDetails } from './bank-details.entity';
import { Produce } from '../../produce/entities/produce.entity';
import { FarmDetails } from './farm-details.entity';

@Entity('farmers')
export class Farmer {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for farmer' })
  id: string;

  @Column({ unique: true })
  @ApiProperty({ description: 'User ID associated with this farmer' })
  userId: string;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  @ApiProperty({ description: 'Farmer\'s rating' })
  rating: number;

  @Column({ default: 0 })
  @ApiProperty({ description: 'Total number of ratings' })
  totalRatings: number;

  @OneToMany(() => BankDetails, bankDetails => bankDetails.farmer, { eager: true })
  @ApiProperty({ description: 'Bank account details', type: [BankDetails] })
  bankAccounts: BankDetails[];

  @OneToMany(() => FarmDetails, farmDetails => farmDetails.farmer, { eager: true })
  @ApiProperty({ description: 'Farm details', type: [FarmDetails] })
  farms: FarmDetails[];

  @OneToMany(() => Produce, produce => produce.farmer)
  @ApiProperty({ description: 'Produce listings by this farmer', type: [Produce] })
  produce: Produce[];

  @CreateDateColumn()
  @ApiProperty({ description: 'When the farmer profile was created' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'When the farmer profile was last updated' })
  updatedAt: Date;

  @ApiProperty({ description: 'Number of produce listings by this farmer' })
  produceCount?: number;
} 