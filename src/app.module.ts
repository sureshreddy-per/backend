import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { typeOrmConfig } from './config/typeorm.config';
import { ProduceModule } from './produce/produce.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OffersModule } from './offers/offers.module';
import { TransactionsModule } from './transactions/transactions.module';
import { QualityModule } from './quality/quality.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TasksModule } from './tasks/tasks.module';
import { FarmersModule } from './farmers/farmers.module';
import { BuyersModule } from './buyers/buyers.module';
import { RatingsModule } from './ratings/ratings.module';
import { InspectorsModule } from './inspectors/inspectors.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 60000,
      limit: 10,
    }]),
    AuthModule,
    UsersModule,
    ProduceModule,
    OffersModule,
    TransactionsModule,
    QualityModule,
    NotificationsModule,
    TasksModule,
    FarmersModule,
    BuyersModule,
    RatingsModule,
    InspectorsModule,
  ],
})
export class AppModule {}
