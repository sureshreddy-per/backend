import { Injectable, ExecutionContext } from '@nestjs/common';
import {
  ThrottlerGuard,
  ThrottlerOptions,
  ThrottlerGenerateKeyFunction,
  ThrottlerGetTrackerFunction
} from '@nestjs/throttler';

@Injectable()
export class RouteSpecificThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
    throttler: ThrottlerOptions,
    getTracker: ThrottlerGetTrackerFunction,
    generateKey: ThrottlerGenerateKeyFunction,
  ): Promise<boolean> {
    const { path } = context.switchToHttp().getRequest();

    // High-security endpoints (auth, admin) - use short window
    if (path.startsWith('/api/auth') || path.startsWith('/api/admin')) {
      const shortOptions = { ...throttler };
      return super.handleRequest(
        context,
        30,
        60000,
        shortOptions,
        getTracker,
        (ctx, suffix, throttlerName) => generateKey(ctx, suffix, throttlerName)
      );
    }

    // Medium security endpoints (transactions, offers) - use medium window
    if (path.startsWith('/api/transactions') || path.startsWith('/api/offers')) {
      const mediumOptions = { ...throttler };
      return super.handleRequest(
        context,
        100,
        300000,
        mediumOptions,
        getTracker,
        (ctx, suffix, throttlerName) => generateKey(ctx, suffix, throttlerName)
      );
    }

    // Public endpoints (get produce, get buyers) - use long window
    if (path.startsWith('/api/produce') || path.startsWith('/api/buyers')) {
      const longOptions = { ...throttler };
      return super.handleRequest(
        context,
        1000,
        3600000,
        longOptions,
        getTracker,
        (ctx, suffix, throttlerName) => generateKey(ctx, suffix, throttlerName)
      );
    }

    // Default rate limit
    return super.handleRequest(
      context,
      limit,
      ttl,
      throttler,
      getTracker,
      (ctx, suffix, throttlerName) => generateKey(ctx, suffix, throttlerName)
    );
  }
}