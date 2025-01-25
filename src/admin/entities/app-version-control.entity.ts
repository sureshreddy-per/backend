import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('app_version_control')
export class AppVersionControl {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  app_type: 'BUYER' | 'FARMER';

  @Column({ type: 'varchar', length: 20 })
  min_version: string;

  @Column({ type: 'varchar', length: 20 })
  latest_version: string;

  @Column({ type: 'boolean', default: false })
  force_update: boolean;

  @Column({ type: 'boolean', default: false })
  maintenance_mode: boolean;

  @Column({ type: 'text', nullable: true })
  maintenance_message: string;

  @Column({ type: 'text', nullable: true })
  update_message: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  store_url: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'varchar', length: 36, nullable: true })
  updated_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 