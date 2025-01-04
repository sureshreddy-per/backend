import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../auth/entities/user.entity';
import { Produce } from '../produce/entities/produce.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Support } from '../support/entities/support.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Produce,
      Transaction,
      Support,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {} 