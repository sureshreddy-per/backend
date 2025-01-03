import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Support } from '../../support/entities/support.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { Produce } from '../../produce/entities/produce.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ unique: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'float', nullable: true })
  latestLat: number;

  @Column({ type: 'float', nullable: true })
  latestLng: number;

  @Column({ type: 'float', nullable: true })
  farmLat: number;

  @Column({ type: 'float', nullable: true })
  farmLng: number;

  @Column({ type: 'float', default: 0 })
  honestyRating: number;

  @Column({ type: 'decimal', default: 0 })
  totalValue: number;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ default: false })
  blockedStatus: boolean;

  @OneToMany(() => Support, support => support.customer)
  supportTickets: Support[];

  @OneToMany(() => Notification, notification => notification.customer)
  notifications: Notification[];

  @OneToMany(() => Produce, produce => produce.customer)
  produces: Produce[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 