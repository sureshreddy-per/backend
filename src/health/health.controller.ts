import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private configService: ConfigService,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  async check() {
    const checks = [
      // Database health check
      () => this.db.pingCheck('database'),

      // Memory usage check (heap)
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024), // 500MB

      // Memory usage check (RSS)
      () => this.memory.checkRSS('memory_rss', 3000 * 1024 * 1024), // 3GB
    ];

    // Only add disk check if not in Railway (Railway has read-only filesystem)
    if (!process.env.RAILWAY_STATIC_URL) {
      checks.push(() => this.disk.checkStorage('disk', {
        thresholdPercent: 0.9,
        path: '/',
      }));
    }

    return this.health.check(checks);
  }

  @Get('liveness')
  @Public()
  async liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('readiness')
  @Public()
  async readiness() {
    try {
      // Only check database for readiness
      await this.db.pingCheck('database');
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}
