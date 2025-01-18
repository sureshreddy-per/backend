import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private http: HttpHealthIndicator,
    private configService: ConfigService,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  async check() {
    const isProduction = process.env.NODE_ENV === 'production';
    const redisUrl = this.configService.get('REDIS_URL');

    const checks = [
      // Database health check
      () => this.db.pingCheck('database'),

      // Memory usage check (heap)
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024), // 200MB

      // Memory usage check (RSS)
      () => this.memory.checkRSS('memory_rss', 3000 * 1024 * 1024), // 3GB

      // Disk storage check
      () => this.disk.checkStorage('disk', {
        thresholdPercent: 0.9, // 90%
        path: '/',
      }),
    ];

    // Add Redis check if URL is configured
    if (redisUrl) {
      checks.push(() => this.http.pingCheck('redis', redisUrl));
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
    // More comprehensive readiness check
    try {
      await this.check();
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
