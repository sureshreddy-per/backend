import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from "typeorm";

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id" })
  user_id: string;

  @Column({
    type: "text"
  })
  type: string;

  @Column({ type: "jsonb" })
  data: Record<string, any>;

  @Column({ default: false })
  is_read: boolean;

  @CreateDateColumn()
  created_at: Date;

  @Column({ name: "read_at", nullable: true })
  read_at?: Date;
}
