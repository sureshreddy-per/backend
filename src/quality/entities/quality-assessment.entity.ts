import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";
import { AssessmentSource } from "../enums/assessment-source.enum";
import { Produce } from "../../produce/entities/produce.entity";
import { Inspector } from "../../inspectors/entities/inspector.entity";
import { InspectionRequest } from "./inspection-request.entity";
import { CategorySpecificAssessment } from "../interfaces/category-assessments.interface";

@Entity("quality_assessments")
@Index(["produce_id", "created_at"])
@Index(["produce_id", "source", "created_at"])
export class QualityAssessment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column()
  produce_id: string;

  @Column("float")
  quality_grade: number;

  @Column("float")
  confidence_level: number;

  @Column("simple-array", { nullable: true })
  defects: string[];

  @Column("simple-array", { nullable: true })
  recommendations: string[];

  @Column({ nullable: true })
  description: string;

  @Column({
    type: "enum",
    enum: ProduceCategory,
  })
  category: ProduceCategory;

  @Column("jsonb")
  category_specific_assessment: CategorySpecificAssessment;

  @Column({
    type: "enum",
    enum: AssessmentSource,
  })
  source: AssessmentSource;

  @Column({ nullable: true })
  inspector_id: string;

  @Column({ nullable: true })
  inspection_request_id: string;

  @Column("jsonb", { nullable: true })
  metadata: {
    ai_model_version?: string;
    assessment_parameters?: Record<string, any>;
    images?: string[];
    location?: string;
    notes?: string;
    inspector_details?: {
      id: string;
      notes?: string;
    };
  };

  @ManyToOne(() => Produce)
  @JoinColumn({ name: "produce_id" })
  produce: Produce;

  @ManyToOne(() => Inspector, { nullable: true })
  @JoinColumn({ name: "inspector_id" })
  inspector: Inspector;

  @OneToOne(() => InspectionRequest, (request) => request.quality_assessment, { nullable: true })
  @JoinColumn({ name: "inspection_request_id" })
  inspection_request: InspectionRequest;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
