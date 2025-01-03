import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('quality')
export class Quality {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'produce_type' })
  produceType: string;

  @Column({ type: 'jsonb' })
  params: Record<string, any>;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
} 