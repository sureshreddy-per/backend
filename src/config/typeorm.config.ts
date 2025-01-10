import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Farmer } from '../farmers/entities/farmer.entity';
import { Buyer } from '../buyers/entities/buyer.entity';
import { Farm } from '../farmers/entities/farm.entity';
import { BankAccount } from '../farmers/entities/bank-account.entity';
import { Produce } from '../produce/entities/produce.entity';
import { Offer } from '../offers/entities/offer.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { QualityAssessment } from '../quality/entities/quality-assessment.entity';
import { Inspector } from '../inspectors/entities/inspector.entity';
import { Rating } from '../ratings/entities/rating.entity';
import { ProduceSynonym } from '../produce/entities/synonym.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { DailyPrice } from '../offers/entities/daily-price.entity';
import { InspectionBaseFeeConfig } from './entities/base-fee-config.entity';
import { InspectionDistanceFeeConfig } from './entities/fee-config.entity';
import { AdminAuditLog } from '../admin/entities/admin-audit-log.entity';
import { SystemConfig } from '../admin/entities/system-config.entity';

config();

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
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
    ProduceSynonym,
    Notification,
    DailyPrice,
    InspectionBaseFeeConfig,
    InspectionDistanceFeeConfig,
    AdminAuditLog,
    SystemConfig,
  ],
  synchronize: true,
  logging: true,
  migrationsRun: false,
};

export default typeOrmConfig;

export const AppDataSource = new DataSource({
  ...typeOrmConfig,
  type: 'postgres',
});