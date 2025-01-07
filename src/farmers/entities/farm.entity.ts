import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Farmer } from './farmer.entity';

@Entity('farms')
export class Farm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  farmer_id: string;

  @ManyToOne(() => Farmer)
  @JoinColumn({ name: 'farmer_id' })
  farmer: Farmer;

  @Column()
  name: string;

  @Column('decimal')
  size: number;

  @Column()
  address: string;

  @Column({ nullable: true })
  lat_lng: string;

  @Column({ nullable: true })
  image: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 