import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SystemConfig } from "./entities/system-config.entity";
import { ConfigAuditLog } from "./entities/config-audit-log.entity";
import { SystemConfigService } from "./services/system-config.service";
import { ConfigAuditService } from "./services/config-audit.service";
import { SystemConfigController } from "./controllers/system-config.controller";
import { ConfigAuditController } from "./controllers/config-audit.controller";
import { DatabaseInitializer } from "./database-initializer";

@Module({
  imports: [TypeOrmModule.forFeature([SystemConfig, ConfigAuditLog])],
  controllers: [SystemConfigController, ConfigAuditController],
  providers: [
    SystemConfigService,
    ConfigAuditService,
    DatabaseInitializer,
  ],
  exports: [SystemConfigService, ConfigAuditService],
})
export class ConfigModule {}
