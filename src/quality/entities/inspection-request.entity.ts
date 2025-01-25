import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Produce } from "../../produce/entities/produce.entity";
import { Inspector } from "../../inspectors/entities/inspector.entity";

export enum InspectionRequestStatus {
  PENDING = "PENDING",
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

@Entity("inspection_requests")
export class InspectionRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "produce_id" })
  produce_id: string;

  @Column({ name: "requester_id" })
  requester_id: string;

  @Column({ name: "inspector_id", nullable: true })
  inspector_id?: string;

  @Column()
  location: string;

  @Column("decimal", { precision: 10, scale: 2 })
  inspection_fee: number;

  @Column({
    type: "enum",
    enum: InspectionRequestStatus,
    default: InspectionRequestStatus.PENDING
  })
  status: InspectionRequestStatus;

  @Column({ type: "timestamp", nullable: true })
  scheduled_at?: Date;

  @Column({ type: "timestamp", nullable: true })
  assigned_at?: Date;

  @Column({ type: "timestamp", nullable: true })
  completed_at?: Date;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Produce)
  @JoinColumn({ name: "produce_id" })
  produce: Produce;

  @ManyToOne(() => Inspector)
  @JoinColumn({ name: "inspector_id" })
  inspector: Inspector;
} 