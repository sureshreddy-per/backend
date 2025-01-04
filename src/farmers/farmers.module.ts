import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Farmer } from './entities/farmer.entity';
import { User } from '../auth/entities/user.entity';
import { Produce } from '../produce/entities/produce.entity';
import { FarmersService } from './farmers.service';
import { FarmersController } from './farmers.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Farmer, User, Produce]),
  ],
  controllers: [FarmersController],
  providers: [FarmersService],
  exports: [FarmersService],
})
export class FarmersModule {} 