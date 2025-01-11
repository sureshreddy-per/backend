import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('produce_synonyms')
export class Synonym {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'canonical_name' })
  canonical_name: string;

  @Column()
  synonym: string;

  @Column({ name: 'is_active', default: true })
  is_active: boolean;

  @Column({ nullable: true })
  language: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
