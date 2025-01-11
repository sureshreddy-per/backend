export enum OfferStatus {
  // Initial state
  PENDING = "PENDING",           // Initial state when auto-generated, waiting for buyer action
  
  // Active states
  ACTIVE = "ACTIVE",            // Offer approved (with or without price modification)
  PRICE_MODIFIED = "PRICE_MODIFIED", // Price modified by buyer, active state
  
  // Final states
  ACCEPTED = "ACCEPTED",        // Transaction created
  REJECTED = "REJECTED",        // Buyer rejected
  CANCELLED = "CANCELLED",      // Buyer cancelled
  EXPIRED = "EXPIRED",          // Time window expired
}
