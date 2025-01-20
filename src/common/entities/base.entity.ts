import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

export abstract class BaseEntity {
  @PrimaryGeneratedColumn("uuid", { 
    name: "id",
    comment: "Primary key using uuid_generate_v4()"
  })
  id: string;

  @CreateDateColumn({ 
    name: "created_at", 
    type: "timestamp with time zone",
    default: () => "CURRENT_TIMESTAMP"
  })
  created_at: Date;

  @UpdateDateColumn({ 
    name: "updated_at", 
    type: "timestamp with time zone",
    default: () => "CURRENT_TIMESTAMP"
  })
  updated_at: Date;
} 