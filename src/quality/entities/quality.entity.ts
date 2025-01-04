import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('qualities')
export class Quality {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ type: 'int' })
  grade: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  confidence: number;

  @Column('simple-array')
  defects: string[];

  @Column('simple-array')
  recommendations: string[];

  @Column({ type: 'jsonb', nullable: true })
  criteria: {
    appearance?: {
      color?: string[];
      size?: {
        min?: number;
        max?: number;
        unit?: string;
      };
      shape?: string[];
      texture?: string[];
    };
    defects?: {
      allowedTypes?: string[];
      maxPercentage?: number;
    };
    composition?: {
      moisture?: {
        min?: number;
        max?: number;
      };
      sugar?: {
        min?: number;
        max?: number;
      };
      [key: string]: {
        min?: number;
        max?: number;
      };
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    marketValue?: {
      min: number;
      max: number;
      currency: string;
    };
    shelfLife?: {
      duration: number;
      unit: string;
    };
    storageRequirements?: {
      temperature?: {
        min: number;
        max: number;
        unit: string;
      };
      humidity?: {
        min: number;
        max: number;
        unit: string;
      };
    };
  };

  @Column({ type: 'text', nullable: true })
  rawAnalysis: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 