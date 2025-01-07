import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  FARMER = 'FARMER',
  BUYER = 'BUYER',
  INSPECTOR = 'INSPECTOR'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  DELETED = 'DELETED',
  BLOCKED = 'BLOCKED'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  mobile_number: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  profile_picture: string;

  @Column({
    type: 'enum',
    enum: UserRole
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION
  })
  status: UserStatus;

  @Column({ nullable: true })
  block_reason: string;

  @Column({ nullable: true })
  last_login_at: Date;

  @Column({ nullable: true })
  scheduled_for_deletion_at: Date;

  @Column({ default: 0 })
  login_attempts: number;

  @Column({ nullable: true })
  last_login_attempt: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
} 