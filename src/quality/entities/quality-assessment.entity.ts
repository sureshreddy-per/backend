import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Produce } from '../../produce/entities/produce.entity';
import { QualityGrade } from '../../produce/enums/quality-grade.enum';
import { ProduceCategory } from '../../produce/entities/produce.entity';

export interface FoodGrainsCriteria {
  moistureContent: number;
  foreignMatter: number;
  proteinContent?: number;
  variety: string;
}

export interface FruitsCriteria {
  sweetness: number;
  size: string;
  color: string;
  ripenessLevel: string;
}

export interface VegetablesCriteria {
  freshness: number;
  color: string;
  firmness: number;
  size: string;
}

export interface SpicesCriteria {
  aroma: number;
  pungency: number;
  oilContent?: number;
  moisture: number;
}

export interface OilseedsCriteria {
  oilContent: number;
  moistureContent: number;
  foreignMatter: number;
  maturity: string;
}

export interface FibersCriteria {
  length: number;
  strength: number;
  fineness: number;
  maturity: string;
}

export interface SugarcaneCriteria {
  sugarContent: number;
  juiceContent: number;
  purity: number;
  maturity: string;
}

export interface FlowersCriteria {
  freshness: number;
  color: string;
  bloomStage: string;
  stemLength: number;
}

export interface MedicinalPlantsCriteria {
  activeIngredientContent: number;
  purity: number;
  moisture: number;
  authenticity: string;
}

export type QualityCriteria = 
  | ({ category: ProduceCategory.FOOD_GRAINS } & FoodGrainsCriteria)
  | ({ category: ProduceCategory.FRUITS } & FruitsCriteria)
  | ({ category: ProduceCategory.VEGETABLES } & VegetablesCriteria)
  | ({ category: ProduceCategory.SPICES } & SpicesCriteria)
  | ({ category: ProduceCategory.OILSEEDS } & OilseedsCriteria)
  | ({ category: ProduceCategory.FIBERS } & FibersCriteria)
  | ({ category: ProduceCategory.SUGARCANE } & SugarcaneCriteria)
  | ({ category: ProduceCategory.FLOWERS } & FlowersCriteria)
  | ({ category: ProduceCategory.MEDICINAL_AND_AROMATIC_PLANTS } & MedicinalPlantsCriteria);

@Entity('quality_assessments')
export class QualityAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  produce_id: string;

  @ManyToOne(() => Produce)
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @Column({
    type: 'enum',
    enum: QualityGrade,
    default: QualityGrade.PENDING
  })
  grade: QualityGrade;

  @Column('jsonb')
  criteria: QualityCriteria;

  @Column({ nullable: true })
  inspector_id: string;

  @Column('text', { array: true, nullable: true })
  images: string[];

  @Column({ nullable: true })
  assessed_at: Date;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  estimated_shelf_life: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  suggested_price: number;

  @Column({ default: false })
  is_primary: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
} 