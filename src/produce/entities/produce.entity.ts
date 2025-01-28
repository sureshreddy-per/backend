import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { Farmer } from "../../farmers/entities/farmer.entity";
import { Farm } from "../../farmers/entities/farm.entity";
import { QualityAssessment } from "../../quality/entities/quality-assessment.entity";
import { QualityGrade } from "../enums/quality-grade.enum";
import { ProduceCategory } from "../enums/produce-category.enum";
import { ProduceStatus } from "../enums/produce-status.enum";
import { Offer } from "../../offers/entities/offer.entity";
import { InspectionRequest } from "../../quality/entities/inspection-request.entity";

@Entity("produce")
@Index("idx_produce_status_location", ["status", "location"])
@Index("idx_produce_farmer_id", ["farmer_id"])
@Index("idx_produce_created_at", ["created_at"])
@Index("idx_produce_name", ["name"])
export class Produce {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "farmer_id" })
  farmer_id: string;

  @Column({ name: "farm_id", nullable: true })
  farm_id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  product_variety: string;

  @Column({
    type: "enum",
    enum: ProduceCategory,
    nullable: true,
  })
  produce_category: ProduceCategory;

  @Column("decimal", { precision: 10, scale: 2 })
  quantity: number;

  @Column({ nullable: true })
  unit: string;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  price_per_unit: number;

  @Column({ type: "text", nullable: false, comment: "Location in 'latitude,longitude' format (e.g., '12.9716,77.5946')" })
  location: string;

  @Column({ nullable: true })
  location_name: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  inspection_fee: number;

  @Column({ type: "boolean", default: false })
  is_inspection_requested: boolean;

  @Column({ type: "uuid", nullable: true })
  inspection_requested_by: string;

  @Column({ type: "timestamp", nullable: true })
  inspection_requested_at: Date;

  @Column({ type: "text", array: true, nullable: false })
  images: string[];

  @Column({
    type: "enum",
    enum: ProduceStatus,
    default: ProduceStatus.PENDING_AI_ASSESSMENT,
    nullable: true
  })
  status: ProduceStatus;

  @Column({ type: "timestamp", nullable: true })
  harvested_at: Date;

  @Column({ type: "timestamp", nullable: true })
  expiry_date: Date;

  @Column({
    type: "integer",
    nullable: true,
    default: 0,
    name: "quality_grade"
  })
  quality_grade: number;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;

  @Column({ type: "varchar", nullable: true })
  video_url: string;

  @Column({ name: "assigned_inspector", nullable: true })
  assigned_inspector: string;

  @ManyToOne(() => Farmer)
  @JoinColumn({ name: "farmer_id" })
  farmer: Farmer;

  @ManyToOne(() => Farm)
  @JoinColumn({ name: "farm_id" })
  farm: Farm;

  @OneToMany(() => QualityAssessment, (assessment) => assessment.produce)
  quality_assessments: QualityAssessment[];

  @OneToMany(() => Offer, (offer) => offer.produce)
  offers: Offer[];

  @OneToMany(() => InspectionRequest, (request) => request.produce)
  inspection_requests: InspectionRequest[];
}
