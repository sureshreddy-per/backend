import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuyersService } from './buyers.service';
import { BuyersController } from './buyers.controller';
import { Buyer } from './entities/buyer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Buyer])],
  providers: [BuyersService],
  controllers: [BuyersController],
  exports: [BuyersService],
})
export class BuyersModule {} 