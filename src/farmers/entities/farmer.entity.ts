import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Farm } from "./farm.entity";
import { BankAccount } from "./bank-account.entity";

@Entity("farmers")
export class Farmer {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id" })
  user_id: string;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;

  @OneToMany(() => Farm, (farm) => farm.farmer)
  farms: Farm[];

  @OneToMany(() => BankAccount, (bankAccount) => bankAccount.farmer)
  bank_accounts: BankAccount[];
}
