import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SystemConfigKey } from '../enums/system-config-key.enum';

@Entity('system_configs')
export class SystemConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SystemConfigKey,
    unique: true
  })
  key: SystemConfigKey;

  @Column('text')
  value: string;

  @Column('text')
  description: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  updated_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
