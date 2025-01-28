export interface OfferAcceptedEvent {
  offer: {
    id: string;
    produce_id: string;
    price_per_unit: number;
    quantity: number;
  };
  buyer: {
    id: string;
    user_id: string;
  };
  farmer: {
    id: string;
    user_id: string;
  };
}