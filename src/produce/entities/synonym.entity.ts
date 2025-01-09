import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('produce_synonyms')
export class ProduceSynonym {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  canonical_name: string;

  @Column('jsonb')
  words: string[];

  @Column('jsonb', { nullable: true })
  translations: Record<string, string>;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  updated_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 