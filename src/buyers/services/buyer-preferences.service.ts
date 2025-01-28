import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BuyerPreferences } from '../entities/buyer-preferences.entity';
import { Buyer } from '../entities/buyer.entity';

export interface UpdateBuyerPreferencesDto {
  produce_names?: string[];
  produce_price_preferences?: Array<{
    produce_name: string;
    min_price: number;
    max_price: number;
  }>;
  notification_enabled?: boolean;
  notification_methods?: string[];
}

@Injectable()
export class BuyerPreferencesService {
  private readonly logger = new Logger(BuyerPreferencesService.name);

  constructor(
    @InjectRepository(BuyerPreferences)
    private readonly buyerPreferencesRepository: Repository<BuyerPreferences>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findByBuyerId(buyerId: string): Promise<BuyerPreferences> {
    const preferences = await this.buyerPreferencesRepository.findOne({
      where: { buyer_id: buyerId }
    });

    if (!preferences) {
      throw new NotFoundException(`Preferences not found for buyer ${buyerId}`);
    }

    return preferences;
  }

  async setPreferences(buyerId: string, data: UpdateBuyerPreferencesDto): Promise<BuyerPreferences> {
    let preferences = await this.buyerPreferencesRepository.findOne({
      where: { buyer_id: buyerId },
      relations: ['buyer']
    });
    const oldPreferences = preferences?.produce_names || [];

    if (!preferences) {
      throw new NotFoundException(`Preferences not found for buyer ${buyerId}`);
    }

    let shouldEmitEvents = false;
    let updatedProduceNames = preferences.produce_names;

    if (data.produce_names) {
      preferences.produce_names = data.produce_names;
      updatedProduceNames = data.produce_names;
      shouldEmitEvents = true;
    }

    if (data.produce_price_preferences) {
      preferences.produce_price_preferences = data.produce_price_preferences;
      preferences.last_price_updated = new Date();
      updatedProduceNames = Array.from(new Set([
        ...updatedProduceNames,
        ...data.produce_price_preferences.map(pref => pref.produce_name)
      ]));
      shouldEmitEvents = true;
    }

    if (data.notification_enabled !== undefined) {
      preferences.notification_enabled = data.notification_enabled;
    }

    if (data.notification_methods) {
      preferences.notification_methods = data.notification_methods;
    }

    // Save preferences first
    preferences = await this.buyerPreferencesRepository.save(preferences);

    // Emit events if preferences changed
    if (shouldEmitEvents && preferences.buyer) {
      // Emit event for handling existing offers
      this.eventEmitter.emit('buyer.preferences.changed', {
        buyer: preferences.buyer,
        oldPreferences,
        newPreferences: updatedProduceNames,
        pricePreferences: data.produce_price_preferences
      });

      // Emit event for generating new offers
      this.eventEmitter.emit('buyer.preferences.updated', {
        buyer: preferences.buyer,
        oldPreferences,
        newPreferences: updatedProduceNames,
        pricePreferences: data.produce_price_preferences
      });
    }

    return preferences;
  }

  async createDefaultPreferences(buyerId: string): Promise<BuyerPreferences> {
    const defaultPreferences = this.buyerPreferencesRepository.create({
      buyer_id: buyerId,
      produce_names: [],
      produce_price_preferences: [],
      notification_enabled: true,
      notification_methods: ['PUSH'],
      last_price_updated: new Date()
    });

    return this.buyerPreferencesRepository.save(defaultPreferences);
  }
}