// ===========================================
// Logging Interceptor
// Request/Response logging with performance metrics
// ===========================================

import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        const { method, url, ip } = request;
        const userAgent = request.get('user-agent') || '';
        const correlationId = (request as any).correlationId || 'unknown';

        const startTime = Date.now();

        return next.handle().pipe(
            tap({
                next: () => {
                    const duration = Date.now() - startTime;
                    const { statusCode } = response;

                    // Log format: [correlationId] METHOD /path - statusCode - duration - IP
                    const logMessage = `[${correlationId}] ${method} ${url} - ${statusCode} - ${duration}ms - ${ip}`;

                    if (statusCode >= 500) {
                        this.logger.error(logMessage);
                    } else if (statusCode >= 400) {
                        this.logger.warn(logMessage);
                    } else if (duration > 1000) {
                        // Log slow requests
                        this.logger.warn(`${logMessage} [SLOW REQUEST]`);
                    } else {
                        this.logger.log(logMessage);
                    }

                    // Log details in development
                    if (process.env.NODE_ENV === 'development') {
                        this.logger.debug(`User-Agent: ${userAgent}`);
                    }
                },
                error: (error) => {
                    const duration = Date.now() - startTime;
                    this.logger.error(
                        `[${correlationId}] ${method} ${url} - ERROR - ${duration}ms - ${ip}`,
                        error.message,
                    );
                },
            }),
        );
    }
}
