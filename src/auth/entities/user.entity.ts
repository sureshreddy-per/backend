import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from '../../users/enums/user-role.enum';

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;


  @Column({
    type: 'enum',
    enum: UserRole,
    array: true,
    default: [UserRole.FARMER]
  })
  roles: UserRole[];

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING
  })
  verificationStatus: VerificationStatus;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isBlocked: boolean;

  @Column({ nullable: true })
  blockReason: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: false })
  isFarmer: boolean;

  @Column({ default: false })
  isBuyer: boolean;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ name: 'is_quality_inspector', default: false })
  isQualityInspector: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ name: 'rating_count', default: 0 })
  ratingCount: number;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  profile: {
    businessName?: string;
    address?: string;
    taxId?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    lastLogin?: Date;
    preferences?: {
      notifications?: boolean;
      language?: string;
      timezone?: string;
    };
    profilePicture?: string;
  };

  @Column({ default: 0 })
  loginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAttempt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}