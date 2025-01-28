import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('system_configs')
export class SystemConfig {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for the system config' })
  id: string;

  @Column({ unique: true })
  @ApiProperty({ description: 'Configuration key' })
  key: string;

  @Column()
  @ApiProperty({ description: 'Configuration value' })
  value: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Description of what this configuration does' })
  description: string;

  @CreateDateColumn()
  @ApiProperty({ description: 'When this config was created' })
  created_at: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'When this config was last updated' })
  updated_at: Date;
} 