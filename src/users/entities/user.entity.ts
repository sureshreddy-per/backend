import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Offer } from '../../offers/entities/offer.entity';
import { Produce } from '../../produce/entities/produce.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum UserRole {
  FARMER = 'FARMER',
  BUYER = 'BUYER',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  DELETED = 'DELETED'
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  mobileNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    array: true,
    default: [UserRole.FARMER]
  })
  roles: UserRole[];

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION
  })
  status: UserStatus;

  @Column({ default: false })
  isBlocked: boolean;

  @Column({ nullable: true })
  blockReason: string;

  @Column({ nullable: true })
  profilePicture: string;

  @Column('jsonb', { nullable: true })
  metadata: {
    address?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
    businessName?: string;
    businessType?: string;
    registrationNumber?: string;
    taxId?: string;
    preferredPaymentMethods?: string[];
    bankDetails?: {
      accountName: string;
      accountNumber: string;
      bankName: string;
      branchCode: string;
    };
    ratings?: {
      average: number;
      count: number;
    };
  };

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ nullable: true })
  verifiedAt: Date;

  @Column({ nullable: true })
  deletedAt: Date;

  @Column({ nullable: true })
  scheduledForDeletionAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Produce, produce => produce.farmer)
  produces: Produce[];

  @OneToMany(() => Offer, offer => offer.buyer)
  offers: Offer[];

  @OneToMany(() => Transaction, transaction => transaction.buyer)
  buyerTransactions: Transaction[];

  @OneToMany(() => Transaction, transaction => transaction.buyer)
  sellerTransactions: Transaction[];
} 