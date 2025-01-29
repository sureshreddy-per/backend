import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminController } from "./controllers/admin.controller";
import { AdminService } from "./services/admin.service";
import { AdminAuditLog } from "./entities/admin-audit-log.entity";
import { SystemConfig } from "../config/entities/system-config.entity";
import { UsersModule } from "../users/users.module";
import { ProduceModule } from "../produce/produce.module";
import { OffersModule } from "../offers/offers.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { AppVersionControl } from './entities/app-version-control.entity';
import { AppVersionService } from './services/app-version.service';
import { AppVersionController } from './controllers/app-version.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminAuditLog, SystemConfig, AppVersionControl]),
    UsersModule,
    forwardRef(() => ProduceModule),
    forwardRef(() => OffersModule),
    forwardRef(() => TransactionsModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [AdminController, AppVersionController],
  providers: [AdminService, AppVersionService],
  exports: [AdminService, AppVersionService],
})
export class AdminModule {}
