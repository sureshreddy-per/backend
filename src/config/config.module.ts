import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfig } from './entities/system-config.entity';
import { ConfigAuditLog } from './entities/config-audit-log.entity';
import { SystemConfigService } from './services/system-config.service';
import { ConfigAuditService } from './services/config-audit.service';
import { SystemConfigController } from './controllers/system-config.controller';
import { ConfigAuditController } from './controllers/config-audit.controller';
import { DatabaseInitializer } from './database-initializer';
import { LanguageService } from './language.service';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forFeature([SystemConfig, ConfigAuditLog]),
  ],
  controllers: [SystemConfigController, ConfigAuditController],
  providers: [
    SystemConfigService,
    ConfigAuditService,
    DatabaseInitializer,
    LanguageService,
  ],
  exports: [
    SystemConfigService,
    ConfigAuditService,
    LanguageService,
  ],
})
export class ConfigModule {}
