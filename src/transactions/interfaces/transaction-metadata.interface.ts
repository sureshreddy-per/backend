export interface TransactionMetadata {
  notes?: string;
  qualityGrade?: string;
  priceAtTransaction?: number;
  deliveryDetails?: {
    address: string;
    contactPerson: string;
    phone: string;
  };
} 