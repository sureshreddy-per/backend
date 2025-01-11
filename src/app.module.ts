import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerModule } from "@nestjs/throttler";
import { CacheModule } from "@nestjs/cache-manager";
import { typeOrmConfig } from "./config/typeorm.config";
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

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    EventEmitterModule.forRoot(),
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      useFactory: () => ({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        ttl: 3600,
      }),
    }),
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 60000,
        limit: 10,
      },
    ]),
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
})
export class AppModule {}
