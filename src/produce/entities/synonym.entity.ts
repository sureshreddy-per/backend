import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('produce_synonyms')
export class Synonym {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'produce_name' })
  produce_name: string;

  @Column()
  synonym: string;

  @Column({ length: 10, nullable: true })
  language: string;

  @Column({ name: 'is_active', default: true })
  is_active: boolean;

  @Column({ name: 'is_ai_generated', default: false })
  is_ai_generated: boolean;

  @Column({ name: 'confidence_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  confidence_score: number;

  @Column({ name: 'last_validated_at', type: 'timestamp', nullable: true })
  last_validated_at: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
