import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { ConfigAuditLog } from "../entities/config-audit-log.entity";
import { SystemConfigKey } from "../enums/system-config-key.enum";
import { OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class ConfigAuditService {
  constructor(
    @InjectRepository(ConfigAuditLog)
    private readonly auditLogRepository: Repository<ConfigAuditLog>,
  ) {}

  @OnEvent("system.config.updated")
  async logConfigChange(payload: {
    key: SystemConfigKey;
    oldValue: any;
    newValue: any;
    updatedBy: string;
    reason?: string;
  }): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      config_key: payload.key,
      old_value: payload.oldValue,
      new_value: payload.newValue,
      updated_by: payload.updatedBy,
      reason: payload.reason,
    });

    await this.auditLogRepository.save(auditLog);
  }

  async getAuditLogs(
    key?: SystemConfigKey,
    startDate?: Date,
    endDate?: Date,
    limit = 50,
  ): Promise<ConfigAuditLog[]> {
    const query = this.auditLogRepository.createQueryBuilder("audit_log");

    if (key) {
      query.where("audit_log.config_key = :key", { key });
    }

    if (startDate && endDate) {
      query.andWhere({
        created_at: Between(startDate, endDate),
      });
    }

    return query.orderBy("audit_log.created_at", "DESC").take(limit).getMany();
  }

  async getLatestChange(key: SystemConfigKey): Promise<ConfigAuditLog | null> {
    return this.auditLogRepository.findOne({
      where: { config_key: key },
      order: { created_at: "DESC" },
    });
  }

  async getChangesByUser(
    userId: string,
    limit = 50,
  ): Promise<ConfigAuditLog[]> {
    return this.auditLogRepository.find({
      where: { updated_by: userId },
      order: { created_at: "DESC" },
      take: limit,
    });
  }
}
