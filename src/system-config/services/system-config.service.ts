import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from '../entities/system-config.entity';

@Injectable()
export class SystemConfigService {
  private readonly logger = new Logger(SystemConfigService.name);

  constructor(
    @InjectRepository(SystemConfig)
    private readonly systemConfigRepository: Repository<SystemConfig>,
  ) {}

  async getValue(key: string): Promise<string | null> {
    const config = await this.systemConfigRepository.findOne({ where: { key } });
    return config?.value || null;
  }

  async setValue(key: string, value: string, description?: string): Promise<SystemConfig> {
    this.logger.log(`Setting system config ${key} to ${value}`);
    
    let config = await this.systemConfigRepository.findOne({ where: { key } });
    
    if (config) {
      config.value = value;
      if (description) {
        config.description = description;
      }
    } else {
      config = this.systemConfigRepository.create({
        key,
        value,
        description,
      });
    }

    return this.systemConfigRepository.save(config);
  }

  async getAll(): Promise<SystemConfig[]> {
    return this.systemConfigRepository.find();
  }

  async deleteConfig(key: string): Promise<void> {
    await this.systemConfigRepository.delete({ key });
  }
} 