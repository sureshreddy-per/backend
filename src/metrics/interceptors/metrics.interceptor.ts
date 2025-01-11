import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { MetricsService } from "../services/metrics.service";
import { RequestStatus } from "../entities/request-metric.entity";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, path, user, ip, headers } = request;

    return next.handle().pipe(
      tap(async (response) => {
        const responseTime = Date.now() - startTime;
        await this.metricsService.logRequest({
          path,
          method,
          user_id: user?.id,
          response_time: responseTime,
          status: RequestStatus.SUCCESS,
          metadata: {
            ip_address: ip,
            user_agent: headers["user-agent"],
            status_code: 200,
            request_body: request.body,
            response_body: response,
          },
        });
      }),
      catchError(async (error) => {
        const responseTime = Date.now() - startTime;
        const status = error instanceof HttpException ? error.getStatus() : 500;
        const message =
          error instanceof HttpException
            ? error.message
            : "Internal server error";

        await this.metricsService.logRequest({
          path,
          method,
          user_id: user?.id,
          response_time: responseTime,
          status: RequestStatus.ERROR,
          error_message: message,
          metadata: {
            ip_address: ip,
            user_agent: headers["user-agent"],
            status_code: status,
            request_body: request.body,
          },
        });

        return throwError(() => error);
      }),
    );
  }
}
