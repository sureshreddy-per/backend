import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { BuyersModule } from './buyers/buyers.module';
import { ProduceModule } from './produce/produce.module';
import { QualityModule } from './quality/quality.module';
import { OffersModule } from './offers/offers.module';
import { TransactionsModule } from './transactions/transactions.module';
import { SupportModule } from './support/support.module';
import { NotificationsModule } from './notifications/notifications.module';

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
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [{
          ttl: +configService.get('THROTTLE_TTL'),
          limit: +configService.get('THROTTLE_LIMIT'),
        }],
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    CustomersModule,
    BuyersModule,
    ProduceModule,
    QualityModule,
    OffersModule,
    TransactionsModule,
    SupportModule,
    NotificationsModule,
  ],
})
export class AppModule {}
