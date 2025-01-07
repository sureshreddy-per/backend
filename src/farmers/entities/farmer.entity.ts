import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Farm } from './farm.entity';
import { BankAccount } from './bank-account.entity';
import { Produce } from '../../produce/entities/produce.entity';

@Entity('farmers')
export class Farmer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Farm, farm => farm.farmer)
  farms: Farm[];

  @OneToMany(() => BankAccount, bankAccount => bankAccount.farmer)
  bank_accounts: BankAccount[];

  @OneToMany(() => Produce, produce => produce.farmer)
  produces: Produce[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 