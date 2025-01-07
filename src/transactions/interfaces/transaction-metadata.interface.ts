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
} 