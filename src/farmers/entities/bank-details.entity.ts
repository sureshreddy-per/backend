import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Farmer } from './farmer.entity';

@Entity('bank_details')
export class BankDetails {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for bank details' })
  id: string;

  @Column()
  @ApiProperty({ description: 'Name on the bank account' })
  accountName: string;

  @Column()
  @ApiProperty({ description: 'Bank account number' })
  accountNumber: string;

  @Column()
  @ApiProperty({ description: 'Name of the bank' })
  bankName: string;

  @Column()
  @ApiProperty({ description: 'Branch code or routing number' })
  branchCode: string;

  @Column({ type: 'uuid' })
  @ApiProperty({ description: 'ID of the farmer this bank account belongs to' })
  farmerId: string;

  @Column({ default: false })
  @ApiProperty({ description: 'Whether this is the primary bank account' })
  isPrimary: boolean;

  @ManyToOne(() => Farmer, farmer => farmer.bankAccounts)
  @JoinColumn({ name: 'farmerId' })
  farmer: Farmer;

  @CreateDateColumn()
  @ApiProperty({ description: 'When the bank details were created' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'When the bank details were last updated' })
  updatedAt: Date;
} 