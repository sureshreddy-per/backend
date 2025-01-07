import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT'
}

export enum MediaCategory {
  PRODUCE = 'PRODUCE',
  PROFILE = 'PROFILE',
  INSPECTION = 'INSPECTION',
  QUALITY_ASSESSMENT = 'QUALITY_ASSESSMENT'
}

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  original_name: string;

  @Column()
  mime_type: string;

  @Column()
  size: number;

  @Column()
  url: string;

  @Column()
  key: string;

  @Column({
    type: 'enum',
    enum: MediaType
  })
  type: MediaType;

  @Column({
    type: 'enum',
    enum: MediaCategory
  })
  category: MediaCategory;

  @Column({ name: 'entity_id' })
  entity_id: string;

  @Column({ name: 'user_id' })
  user_id: string;

  @Column('jsonb', { nullable: true })
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    thumbnail_url?: string;
  };

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
} 