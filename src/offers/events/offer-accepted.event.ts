export class OfferAcceptedEvent {
  offer_id: string;
  produce_id: string;
  buyer_id: string;
  farmer_id: string;
  price_per_unit: number;
  quantity: number;
  quality_grade: string;
  distance_km: number;
  inspection_fee: number;
  buyer_user_id: string;  // Added for notifications
  metadata?: Record<string, any>;
}