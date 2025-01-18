import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/health')
export class HealthController {
  @Get()
  @Public()
  check() {
    return { status: 'ok' };
  }
}
