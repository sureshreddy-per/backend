export interface TransactionMetadata {
  notes?: string;
  quality_grade_at_transaction?: string;
  price_at_transaction?: number;
  location_at_transaction?: {
    latitude: number;
    longitude: number;
  };
  delivery_details?: {
    address: string;
    contact_person: string;
    phone: string;
  };
  completed_at?: Date;
  cancelled_at?: Date;
  cancellation_reason?: string;
  buyer_rating?: number;
  farmer_rating?: number;
  buyer_review?: string;
  farmer_review?: string;
  quality_grade?: string;
  inspection_result?: any;
  delivery_notes?: string;
  inspection_notes?: string;
  delivery_window_started_at?: Date;
  delivery_confirmed_at?: Date;
  inspection_completed_at?: Date;
}
