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
import * as path from 'path';

config();

const entities = [
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
];

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: "postgres",
  host: process.env.DB_HOST || 'postgres.railway.internal',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'railway',
  entities,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  autoLoadEntities: true,
  retryAttempts: 20,
  retryDelay: 5000,
  keepConnectionAlive: true,
  connectTimeoutMS: 30000,
  extra: {
    max: 25,
    connectionTimeoutMillis: 30000,
    query_timeout: 10000,
    statement_timeout: 10000,
    keepalive: true,
    keepaliveInitialDelayMillis: 10000,
    application_name: 'farmdeva-backend',
    fallback_application_name: 'farmdeva-backend-fallback',
    options: '-c statement_timeout=10000',
  },
  migrations: [path.join(__dirname, '../migrations/*{.ts,.js}')],
  migrationsRun: true,
};

export default typeOrmConfig;

export const AppDataSource = new DataSource({
  ...typeOrmConfig,
  type: "postgres",
  entities,
});
