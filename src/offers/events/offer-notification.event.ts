import { NotificationType } from "../../notifications/enums/notification-type.enum";

export class OfferNotificationEvent {
  constructor(
    public readonly user_id: string,
    public readonly type: NotificationType,
    public readonly data: Record<string, any>
  ) {}
}

export class OfferCreatedEvent {
  constructor(
    public readonly offer_id: string,
    public readonly produce_id: string,
    public readonly buyer_id: string,
    public readonly farmer_id: string,
    public readonly price_per_unit: number,
    public readonly distance_km: number,
    public readonly quality_grade: number,
    public readonly inspection_fee: number
  ) {}
}

export class OfferStatusChangedEvent {
  constructor(
    public readonly offer_id: string,
    public readonly user_id: string,
    public readonly old_status: string,
    public readonly new_status: string,
    public readonly reason?: string
  ) {}
}

export class OfferPriceModifiedEvent {
  constructor(
    public readonly offer_id: string,
    public readonly user_id: string,
    public readonly old_price: number,
    public readonly new_price: number,
    public readonly reason?: string
  ) {}
} 