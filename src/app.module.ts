import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
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
import { InspectionModule } from './inspection/inspection.module';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 60000,
      limit: 10
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
    InspectionModule,
    ConfigModule,
    HealthModule,
    AdminModule,
  ],
})
export class AppModule {}
