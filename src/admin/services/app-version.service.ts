import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppVersionControl } from '../entities/app-version-control.entity';
import { UpdateAppVersionDto, AppType } from '../dto/update-app-version.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AppVersionService {
  constructor(
    @InjectRepository(AppVersionControl)
    private readonly appVersionRepository: Repository<AppVersionControl>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private getCacheKey(appType: AppType): string {
    return `app_version_${appType}`;
  }

  async getAppVersion(appType: AppType): Promise<AppVersionControl> {
    const cacheKey = this.getCacheKey(appType);
    const cached = await this.cacheManager.get<AppVersionControl>(cacheKey);
    if (cached) return cached;

    const version = await this.appVersionRepository.findOne({
      where: { app_type: appType, is_active: true },
    });

    if (version) {
      await this.cacheManager.set(cacheKey, version, 300); // Cache for 5 minutes
    }

    return version;
  }

  async updateAppVersion(
    adminId: string,
    updateDto: UpdateAppVersionDto,
  ): Promise<AppVersionControl> {
    let version = await this.appVersionRepository.findOne({
      where: { app_type: updateDto.app_type, is_active: true },
    });

    if (!version) {
      version = this.appVersionRepository.create({
        app_type: updateDto.app_type,
        min_version: updateDto.min_version || '1.0.0',
        latest_version: updateDto.latest_version || '1.0.0',
        is_active: true,
      });
    }

    // Update fields if provided
    Object.assign(version, {
      ...updateDto,
      updated_by: adminId,
    });

    const savedVersion = await this.appVersionRepository.save(version);
    
    // Clear cache
    await this.cacheManager.del(this.getCacheKey(updateDto.app_type));

    return savedVersion;
  }

  async checkAppStatus(appType: AppType, currentVersion: string): Promise<{
    needsUpdate: boolean;
    forceUpdate: boolean;
    maintenanceMode: boolean;
    message?: string;
    storeUrl?: string;
  }> {
    const version = await this.getAppVersion(appType);
    if (!version) {
      return {
        needsUpdate: false,
        forceUpdate: false,
        maintenanceMode: false,
      };
    }

    if (version.maintenance_mode) {
      return {
        needsUpdate: false,
        forceUpdate: false,
        maintenanceMode: true,
        message: version.maintenance_message,
      };
    }

    const currentParts = currentVersion.split('.').map(Number);
    const minParts = version.min_version.split('.').map(Number);
    const latestParts = version.latest_version.split('.').map(Number);

    const isOutdated = this.compareVersions(currentParts, latestParts) < 0;
    const isBelowMin = this.compareVersions(currentParts, minParts) < 0;

    return {
      needsUpdate: isOutdated,
      forceUpdate: isBelowMin || version.force_update,
      maintenanceMode: false,
      message: version.update_message,
      storeUrl: version.store_url,
    };
  }

  private compareVersions(v1: number[], v2: number[]): number {
    for (let i = 0; i < 3; i++) {
      if (v1[i] > v2[i]) return 1;
      if (v1[i] < v2[i]) return -1;
    }
    return 0;
  }
} 