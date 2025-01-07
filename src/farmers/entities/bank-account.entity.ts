import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Farmer } from './farmer.entity';

@Entity('bank_accounts')
export class BankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  farmer_id: string;

  @Column()
  account_name: string;

  @Column()
  account_number: string;

  @Column()
  bank_name: string;

  @Column()
  branch_code: string;

  @Column({ default: false })
  is_primary: boolean;

  @ManyToOne(() => Farmer, farmer => farmer.bank_accounts)
  @JoinColumn({ name: 'farmer_id' })
  farmer: Farmer;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 