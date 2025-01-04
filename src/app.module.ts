import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { ProduceModule } from './produce/produce.module';
import { QualityModule } from './quality/quality.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RatingsModule } from './ratings/ratings.module';
import { SupportModule } from './support/support.module';
import { TransactionsModule } from './transactions/transactions.module';
import { OffersModule } from './offers/offers.module';
import { AdminModule } from './admin/admin.module';
import { FarmersModule } from './farmers/farmers.module';
import { BuyersModule } from './buyers/buyers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60,
      limit: 10,
    }]),
    EventEmitterModule.forRoot(),
    AuthModule,
    FarmersModule,
    BuyersModule,
    ProduceModule,
    QualityModule,
    NotificationsModule,
    RatingsModule,
    SupportModule,
    TransactionsModule,
    OffersModule,
    AdminModule,
  ],
})
export class AppModule {}
