import { QualityAssessment } from '../entities/quality-assessment.entity';

export interface TransformedProduce {
  id: string;
  name: string;
  images: string[];
  location: string;
  quality_grade: number;
  quality_assessments: QualityAssessment[];
}

export interface TransformedInspector {
  id: string;
  name: string;
  mobile_number: string;
  location: string;
}

export interface TransformedInspection {
  id: string;
  produce_id: string;
  requester_id: string;
  inspector_id?: string | null;
  location: string;
  inspection_fee: number;
  status: string;
  scheduled_at?: Date | null;
  assigned_at?: Date | null;
  completed_at?: Date | null;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
  produce: TransformedProduce;
  inspector?: TransformedInspector | null;
} 