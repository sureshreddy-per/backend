import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum MediaType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  DOCUMENT = "DOCUMENT"
}

@Entity("media")
export class Media {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  url: string;

  @Column({
    type: "enum",
    enum: MediaType,
    default: MediaType.IMAGE
  })
  type: MediaType;

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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
