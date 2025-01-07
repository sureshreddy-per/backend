import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum RequestStatus {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

@Entity('request_metrics')
export class RequestMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  path: string;

  @Column()
  method: string;

  @Column({ name: 'user_id', nullable: true })
  user_id: string;

  @Column({ name: 'response_time' })
  response_time: number;

  @Column({
    type: 'enum',
    enum: RequestStatus
  })
  status: RequestStatus;

  @Column({ nullable: true })
  error_message: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    ip_address?: string;
    user_agent?: string;
    status_code?: number;
    request_body?: any;
    response_body?: any;
  };

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
} 