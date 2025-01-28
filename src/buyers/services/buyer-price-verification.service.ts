import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Buyer } from '../entities/buyer.entity';
import { BuyerPreferences } from '../entities/buyer-preferences.entity';
import { NotificationType } from '../../notifications/enums/notification-type.enum';

@Injectable()
export class BuyerPriceVerificationService {
  private readonly logger = new Logger(BuyerPriceVerificationService.name);

  constructor(
    @InjectRepository(Buyer)
    private readonly buyerRepository: Repository<Buyer>,
    @InjectRepository(BuyerPreferences)
    private readonly buyerPreferencesRepository: Repository<BuyerPreferences>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async verifyBuyerPrices() {
    this.logger.log('Starting daily buyer price verification');

    try {
      // Get all active buyers with their preferences
      const buyers = await this.buyerRepository.find({
        where: { is_active: true },
        relations: ['preferences', 'user'],
      });

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      for (const buyer of buyers) {
        try {
          if (!buyer.preferences?.produce_price_preferences?.length) {
            // If buyer has no price preferences, deactivate them
            await this.deactivateBuyer(buyer, 'No price preferences set');
            continue;
          }

          if (!buyer.preferences.last_price_updated || 
              buyer.preferences.last_price_updated < twentyFourHoursAgo) {
            // If prices haven't been updated in last 24 hours, deactivate buyer
            await this.deactivateBuyer(buyer, 'Prices not updated in last 24 hours');
          }
        } catch (error) {
          this.logger.error(
            `Error processing buyer ${buyer.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      // Check for inactive buyers who have recently updated their prices
      const inactiveBuyers = await this.buyerRepository.find({
        where: { is_active: false },
        relations: ['preferences', 'user'],
      });

      for (const buyer of inactiveBuyers) {
        try {
          if (buyer.preferences?.last_price_updated &&
              buyer.preferences.last_price_updated > twentyFourHoursAgo) {
            // If inactive buyer has updated prices recently, reactivate them
            await this.reactivateBuyer(buyer);
          }
        } catch (error) {
          this.logger.error(
            `Error processing inactive buyer ${buyer.id}: ${error.message}`,
            error.stack,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error in buyer price verification:', error.stack);
    }
  }

  private async deactivateBuyer(buyer: Buyer, reason: string) {
    this.logger.log(`Deactivating buyer ${buyer.id} due to: ${reason}`);
    
    buyer.is_active = false;
    await this.buyerRepository.save(buyer);

    // Notify buyer about account deactivation
    this.eventEmitter.emit('notification.create', {
      user_id: buyer.user_id,
      type: NotificationType.ACCOUNT_STATUS_UPDATE,
      data: {
        status: 'inactive',
        reason,
        action_required: 'Please update your produce price preferences to reactivate your account',
        deactivated_at: new Date(),
      },
    });
  }

  private async reactivateBuyer(buyer: Buyer) {
    this.logger.log(`Reactivating buyer ${buyer.id}`);
    
    buyer.is_active = true;
    await this.buyerRepository.save(buyer);

    // Notify buyer about account reactivation
    this.eventEmitter.emit('notification.create', {
      user_id: buyer.user_id,
      type: NotificationType.ACCOUNT_STATUS_UPDATE,
      data: {
        status: 'active',
        message: 'Your account has been reactivated after price update',
        reactivated_at: new Date(),
      },
    });
  }
} 