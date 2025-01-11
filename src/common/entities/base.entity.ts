import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Column } from "typeorm";

export abstract class BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 