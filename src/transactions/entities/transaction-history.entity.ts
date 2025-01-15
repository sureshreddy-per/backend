import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "../../common/entities/base.entity";
import { Transaction, TransactionStatus } from "./transaction.entity";

export enum TransactionEvent {
  STATUS_CHANGED = "STATUS_CHANGED",
  DELIVERY_WINDOW_STARTED = "DELIVERY_WINDOW_STARTED",
  DELIVERY_CONFIRMED = "DELIVERY_CONFIRMED",
  INSPECTION_COMPLETED = "INSPECTION_COMPLETED",
  RATING_SUBMITTED = "RATING_SUBMITTED",
  PAYMENT_PROCESSED = "PAYMENT_PROCESSED",
  NOTE_ADDED = "NOTE_ADDED",
}

@Entity("transaction_history")
export class TransactionHistory extends BaseEntity {
  @Column({ name: "transaction_id" })
  transactionId: string;

  @Column({
    type: "enum",
    enum: TransactionEvent,
  })
  event: TransactionEvent;

  @Column({
    type: "enum",
    enum: TransactionStatus,
    nullable: true,
  })
  oldStatus?: TransactionStatus;

  @Column({
    type: "enum",
    enum: TransactionStatus,
    nullable: true,
  })
  newStatus?: TransactionStatus;

  @Column({ name: "user_id" })
  userId: string;

  @Column("jsonb", { nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: "transaction_id" })
  transaction: Transaction;
}
