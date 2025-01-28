import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuyersController } from './controllers/buyers.controller';
import { BuyersService } from './buyers.service';
import { Buyer } from './entities/buyer.entity';
import { BuyerPreferencesController } from './controllers/buyer-preferences.controller';
import { BuyerPreferencesService } from './services/buyer-preferences.service';
import { BuyerPreferences } from './entities/buyer-preferences.entity';
import { OffersModule } from '../offers/offers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProduceModule } from '../produce/produce.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Buyer, BuyerPreferences]),
    OffersModule,
    NotificationsModule,
    ProduceModule
  ],
  controllers: [BuyersController, BuyerPreferencesController],
  providers: [BuyersService, BuyerPreferencesService],
  exports: [BuyersService, BuyerPreferencesService]
})
export class BuyersModule {}
