import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("media")
export class Media {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  url: string;

  @Column({
    type: "text",
    default: "IMAGE"
  })
  type: string;

  @Column({ nullable: true })
  mime_type: string;

  @Column({ nullable: true })
  size: number;

  @Column({ nullable: true })
  original_name: string;

  @Column("jsonb", { nullable: true })
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    thumbnail_url?: string;
  };

  @Column()
  key: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
