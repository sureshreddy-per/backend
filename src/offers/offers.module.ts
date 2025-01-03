import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { OffersGateway } from './offers.gateway';
import { Offer } from './entities/offer.entity';
import { ProduceModule } from '../produce/produce.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Offer]),
    ProduceModule,
    AuthModule,
  ],
  controllers: [OffersController],
  providers: [OffersService, OffersGateway],
  exports: [OffersService],
})
export class OffersModule {} 