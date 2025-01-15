import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { config } from "dotenv";
import { DataSource } from "typeorm";
import { User } from "../users/entities/user.entity";
import { Farmer } from "../farmers/entities/farmer.entity";
import { Buyer } from "../buyers/entities/buyer.entity";
import { Farm } from "../farmers/entities/farm.entity";
import { BankAccount } from "../farmers/entities/bank-account.entity";
import { Produce } from "../produce/entities/produce.entity";
import { Offer } from "../offers/entities/offer.entity";
import { Transaction } from "../transactions/entities/transaction.entity";
import { QualityAssessment } from "../quality/entities/quality-assessment.entity";
import { Inspector } from "../inspectors/entities/inspector.entity";
import { Rating } from "../ratings/entities/rating.entity";
import { Synonym } from "../produce/entities/synonym.entity";
import { Notification } from "../notifications/entities/notification.entity";
import { DailyPrice } from "../offers/entities/daily-price.entity";
import { InspectionDistanceFeeConfig } from "./entities/fee-config.entity";
import { AdminAuditLog } from "../admin/entities/admin-audit-log.entity";
import { SystemConfig } from "./entities/system-config.entity";
import { InspectionRequest } from "../quality/entities/inspection-request.entity";
import { BusinessMetric } from "../business-metrics/entities/business-metric.entity";
import { SupportTicket } from "../support/entities/support-ticket.entity";
import { Support } from "../support/entities/support.entity";
import { Ticket } from "../support/entities/ticket.entity";
import { Media } from "../media/entities/media.entity";
import { Report } from "../reports/entities/report.entity";
import { RequestMetric } from "../metrics/entities/request-metric.entity";
import { ConfigAuditLog } from "./entities/config-audit-log.entity";
import { BuyerPreferences } from "../buyers/entities/buyer-preferences.entity";
import { NotificationPreferences } from "../notifications/entities/notification-preferences.entity";

config();

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    User,
    Farmer,
    Buyer,
    Farm,
    BankAccount,
    Produce,
    Offer,
    Transaction,
    QualityAssessment,
    Inspector,
    Rating,
    Synonym,
    Notification,
    NotificationPreferences,
    DailyPrice,
    InspectionDistanceFeeConfig,
    AdminAuditLog,
    SystemConfig,
    InspectionRequest,
    BusinessMetric,
    SupportTicket,
    Support,
    Ticket,
    Media,
    Report,
    RequestMetric,
    ConfigAuditLog,
    BuyerPreferences,
  ],
  synchronize: process.env.NODE_ENV === 'development',
  dropSchema: false,
  logging: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development' ? "advanced-console" : "file",
  maxQueryExecutionTime: 1000, // Log slow queries (>1s)
  // Production optimizations
  extra: {
    // Connection pool settings
    max: parseInt(process.env.DB_POOL_MAX || '20'), // max number of connections
    min: parseInt(process.env.DB_POOL_MIN || '5'),  // min number of connections
    idleTimeoutMillis: 60000, // how long a connection can be idle (1 minute)
    connectionTimeoutMillis: 10000, // connection timeout (10 seconds)
    maxUses: 7500, // number of times a connection can be used before being destroyed
  },
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false, // You might want to set this to true in production with proper SSL certs
    ca: process.env.DB_SSL_CA,
    key: process.env.DB_SSL_KEY,
    cert: process.env.DB_SSL_CERT,
  } : undefined,
  cache: {
    type: "redis",
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 0,
      duration: 60000, // Cache duration in milliseconds (1 minute)
    },
    ignoreErrors: true,
  },
  // Retry connection settings
  retryAttempts: 10,
  retryDelay: 3000,
  keepConnectionAlive: true,
  migrationsRun: false
};

export default typeOrmConfig;

export const AppDataSource = new DataSource({
  ...typeOrmConfig,
  type: "postgres",
});
