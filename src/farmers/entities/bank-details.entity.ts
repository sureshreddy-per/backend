import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Farmer } from "./farmer.entity";

@Entity("bank_accounts")
export class BankDetails {
  @PrimaryGeneratedColumn("uuid")
  @ApiProperty({ description: "Unique identifier for bank details" })
  id: string;

  @Column({ name: "account_name" })
  @ApiProperty({ description: "Name on the bank account" })
  account_name: string;

  @Column({ name: "account_number" })
  @ApiProperty({ description: "Bank account number" })
  account_number: string;

  @Column({ name: "bank_name" })
  @ApiProperty({ description: "Name of the bank" })
  bank_name: string;

  @Column({ name: "branch_code" })
  @ApiProperty({ description: "Branch code or routing number" })
  branch_code: string;

  @Column({ type: "uuid", name: "farmer_id" })
  @ApiProperty({ description: "ID of the farmer this bank account belongs to" })
  farmer_id: string;

  @Column({ default: false, name: "is_primary" })
  @ApiProperty({ description: "Whether this is the primary bank account" })
  is_primary: boolean;

  @ManyToOne(() => Farmer, (farmer) => farmer.bank_accounts)
  @JoinColumn({ name: "farmer_id" })
  farmer: Farmer;

  @CreateDateColumn()
  @ApiProperty({ description: "When the bank details were created" })
  created_at: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: "When the bank details were last updated" })
  updated_at: Date;
}
