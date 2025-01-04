import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Produce } from '../../produce/entities/produce.entity';

@Entity('farmers')
export class Farmer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    farmName?: string;
    farmSize?: number;
    farmLocation?: {
      latitude: number;
      longitude: number;
    };
    certifications?: string[];
  };

  @OneToMany(() => Produce, produce => produce.farmer)
  produces: Produce[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 