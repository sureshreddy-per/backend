import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuyersService } from './buyers.service';
import { BuyersController } from './buyers.controller';
import { Buyer } from './entities/buyer.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Buyer]),
    UsersModule,
  ],
  providers: [BuyersService],
  controllers: [BuyersController],
  exports: [BuyersService],
})
export class BuyersModule {} 