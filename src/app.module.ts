import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerModule } from "@nestjs/throttler";
import { CacheModule } from "@nestjs/cache-manager";
import { APP_GUARD } from '@nestjs/core';
import { typeOrmConfig } from "./config/typeorm.config";
import { RouteSpecificThrottlerGuard } from "./common/middleware/route-specific-throttle.guard";
import { ProduceModule } from "./produce/produce.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { OffersModule } from "./offers/offers.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { QualityModule } from "./quality/quality.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { TasksModule } from "./tasks/tasks.module";
import { FarmersModule } from "./farmers/farmers.module";
import { BuyersModule } from "./buyers/buyers.module";
import { RatingsModule } from "./ratings/ratings.module";
import { InspectorsModule } from "./inspectors/inspectors.module";
import { ConfigModule } from "./config/config.module";
import { HealthModule } from "./health/health.module";
import { AdminModule } from "./admin/admin.module";
import { SupportModule } from "./support/support.module";
import { MediaModule } from "./media/media.module";
import { ReportsModule } from "./reports/reports.module";
import { MetricsModule } from "./metrics/metrics.module";
import { BusinessMetricsModule } from "./business-metrics/business-metrics.module";
import type { RedisClientOptions } from "redis";
import { LoggerService } from "./common/services/logger.service";
import configuration from "./config/configuration";

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.development', '.env'],
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    EventEmitterModule.forRoot(),
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        socket: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: parseInt(configService.get('REDIS_PORT', '6379')),
        },
        password: configService.get('REDIS_PASSWORD'),
        database: parseInt(configService.get('REDIS_DB', '0')),
        ttl: parseInt(configService.get('REDIS_TTL', '3600')), // 1 hour default
        retryStrategy: (times: number) => {
          if (times > 10) return null;
          return Math.min(times * 200, 2000);
        },
        reconnectOnError: (err: Error) => {
          const targetError = 'READONLY';
          return err.message.includes(targetError);
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'short',
          ttl: config.get('RATE_LIMIT_SHORT_TTL', 60000),
          limit: process.env.NODE_ENV === 'production' ? 30 : 60,
        },
        {
          name: 'medium',
          ttl: config.get('RATE_LIMIT_MEDIUM_TTL', 300000),
          limit: process.env.NODE_ENV === 'production' ? 100 : 200,
        },
        {
          name: 'long',
          ttl: config.get('RATE_LIMIT_LONG_TTL', 3600000),
          limit: process.env.NODE_ENV === 'production' ? 1000 : 2000,
        },
      ],
    }),
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
    ConfigModule,
    HealthModule,
    AdminModule,
    SupportModule,
    MediaModule,
    ReportsModule,
    MetricsModule,
    BusinessMetricsModule,
  ],
  providers: [
    LoggerService,
    {
      provide: APP_GUARD,
      useClass: RouteSpecificThrottlerGuard,
    },
  ],
  exports: [
    LoggerService,
  ],
})
export class AppModule {}
