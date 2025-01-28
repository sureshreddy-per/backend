import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Offer } from '../../offers/entities/offer.entity';
import { OfferStatus } from '../../offers/enums/offer-status.enum';
import { Transaction } from '../entities/transaction.entity';
import { TransactionService } from './transaction.service';
import { SystemConfig } from '../../system-config/entities/system-config.entity';

@Injectable()
export class TransactionRecoveryService {
  private readonly logger = new Logger(TransactionRecoveryService.name);

  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(SystemConfig)
    private readonly systemConfigRepository: Repository<SystemConfig>,
    private readonly transactionService: TransactionService,
    private readonly configService: ConfigService,
  ) {}

  @Cron('*/5 * * * *') // Runs every 5 minutes
  async handleTransactionRecovery() {
    try {
      this.logger.log('[handleTransactionRecovery] Starting transaction recovery check');

      // Check if recovery is enabled in system config
      const recoveryConfig = await this.systemConfigRepository.findOne({
        where: { key: 'transaction_recovery_cron_enabled' }
      });

      if (!recoveryConfig || recoveryConfig.value !== 'true') {
        this.logger.log('[handleTransactionRecovery] Transaction recovery is disabled');
        return;
      }

      // Find accepted offers without transactions
      const acceptedOffers = await this.offerRepository
        .createQueryBuilder('offer')
        .leftJoin(Transaction, 'transaction', 'transaction.offer_id = offer.id')
        .where('offer.status = :status', { status: OfferStatus.ACCEPTED })
        .andWhere('transaction.id IS NULL')
        .leftJoinAndSelect('offer.buyer', 'buyer')
        .leftJoinAndSelect('offer.produce', 'produce')
        .leftJoinAndSelect('produce.farmer', 'farmer')
        .getMany();

      this.logger.log(`[handleTransactionRecovery] Found ${acceptedOffers.length} accepted offers without transactions`);

      // Create transactions for each missing offer
      for (const offer of acceptedOffers) {
        try {
          this.logger.log(`[handleTransactionRecovery] Creating transaction for offer ${offer.id}`);
          
          const event = {
            offer,
            buyer: offer.buyer,
            farmer: offer.produce.farmer
          };

          await this.transactionService.handleOfferAccepted(event);
          this.logger.log(`[handleTransactionRecovery] Successfully created transaction for offer ${offer.id}`);
        } catch (error) {
          this.logger.error(
            `[handleTransactionRecovery] Failed to create transaction for offer ${offer.id}: ${error.message}`,
            error.stack
          );
          // Continue with next offer even if one fails
          continue;
        }
      }

      this.logger.log('[handleTransactionRecovery] Completed transaction recovery check');
    } catch (error) {
      this.logger.error(
        `[handleTransactionRecovery] Failed to complete transaction recovery: ${error.message}`,
        error.stack
      );
    }
  }
} 
