import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('synonyms')
export class Synonym {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb' })
  words: string[];

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
} 