import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_configs')
export class SystemConfig {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({
    type: 'text',
    unique: true,
    nullable: false
  })
  key: string;

  @Column({
    type: 'text',
    nullable: false
  })
  value: string;

  @Column({
    type: 'text',
    nullable: false
  })
  description: string;

  @Column({
    type: 'boolean',
    default: true,
    nullable: false
  })
  is_active: boolean;

  @Column({
    type: 'uuid',
    nullable: true
  })
  updated_by: string;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    name: 'created_at',
    nullable: false
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    name: 'updated_at',
    nullable: false
  })
  updated_at: Date;
}
