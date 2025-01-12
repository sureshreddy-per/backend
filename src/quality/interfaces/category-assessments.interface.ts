export interface CategorySpecificAssessment {
  freshness?: {
    score: number;
    details?: string[];
  };
  appearance?: {
    score: number;
    details?: string[];
  };
  size?: {
    score: number;
    details?: string[];
  };
  ripeness?: {
    score: number;
    details?: string[];
  };
  damage?: {
    score: number;
    details?: string[];
  };
  [key: string]: {
    score: number;
    details?: string[];
  } | undefined;
} 