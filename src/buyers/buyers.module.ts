import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Buyer } from './entities/buyer.entity';
import { User } from '../auth/entities/user.entity';
import { BuyersService } from './buyers.service';
import { BuyersController } from './buyers.controller';
import { BuyerPrice } from './entities/buyer-price.entity';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    TypeOrmModule.forFeature([Buyer, User, BuyerPrice]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [BuyersController],
  providers: [BuyersService],
  exports: [BuyersService],
})
export class BuyersModule {} 