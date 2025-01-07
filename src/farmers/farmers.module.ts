import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Farmer } from './entities/farmer.entity';
import { Farm } from './entities/farm.entity';
import { BankAccount } from './entities/bank-account.entity';
import { FarmersService } from './farmers.service';
import { FarmersController } from './farmers.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Farmer, Farm, BankAccount]),
    UsersModule,
  ],
  providers: [FarmersService],
  controllers: [FarmersController],
  exports: [FarmersService],
})
export class FarmersModule {} 