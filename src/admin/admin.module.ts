import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { AdminAuditLog } from './entities/admin-audit-log.entity';
import { SystemConfig } from './entities/system-config.entity';
import { UsersModule } from '../users/users.module';
import { ProduceModule } from '../produce/produce.module';
import { OffersModule } from '../offers/offers.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminAuditLog, SystemConfig]),
    UsersModule,
    ProduceModule,
    OffersModule,
    TransactionsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {} 