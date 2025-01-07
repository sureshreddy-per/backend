import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('synonyms')
export class Synonym {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('jsonb')
  words: string[];

  @UpdateDateColumn()
  updated_at: Date;
} 