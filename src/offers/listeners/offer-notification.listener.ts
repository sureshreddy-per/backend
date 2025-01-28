import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { 
  OfferNotificationEvent, 
  OfferCreatedEvent,
  OfferStatusChangedEvent,
  OfferPriceModifiedEvent 
} from '../events/offer-notification.event';
import { NotificationType } from '../../notifications/enums/notification-type.enum';

@Injectable()
export class OfferNotificationListener {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @OnEvent('offer.notification')
  async handleNotification(event: OfferNotificationEvent) {
    this.eventEmitter.emit('notification.create', {
      user_id: event.user_id,
      type: event.type,
      data: event.data,
    });
  }

  @OnEvent('offer.created')
  async handleOfferCreated(event: OfferCreatedEvent) {
    // Notify buyer
    this.eventEmitter.emit('notification.create', {
      user_id: event.buyer_id,
      type: NotificationType.NEW_AUTO_OFFER,
      data: {
        offer_id: event.offer_id,
        produce_id: event.produce_id,
        price: event.price_per_unit,
        quality_grade: event.quality_grade,
        inspection_fee: event.inspection_fee,
        distance_km: event.distance_km,
      },
    });

    // Notify farmer
    this.eventEmitter.emit('notification.create', {
      user_id: event.farmer_id,
      type: NotificationType.NEW_OFFER,
      data: {
        offer_id: event.offer_id,
        produce_id: event.produce_id,
        price_per_unit: event.price_per_unit,
      },
    });
  }

  @OnEvent('offer.status.changed')
  async handleStatusChanged(event: OfferStatusChangedEvent) {
    this.eventEmitter.emit('notification.create', {
      user_id: event.user_id,
      type: NotificationType.OFFER_STATUS_UPDATE,
      data: {
        offer_id: event.offer_id,
        old_status: event.old_status,
        new_status: event.new_status,
        reason: event.reason,
      },
    });
  }

  @OnEvent('offer.price.modified')
  async handlePriceModified(event: OfferPriceModifiedEvent) {
    this.eventEmitter.emit('notification.create', {
      user_id: event.user_id,
      type: NotificationType.OFFER_PRICE_UPDATE,
      data: {
        offer_id: event.offer_id,
        old_price: event.old_price,
        new_price: event.new_price,
        reason: event.reason,
      },
    });
  }
} 