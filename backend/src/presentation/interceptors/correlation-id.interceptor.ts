// ===========================================
// Correlation ID Interceptor
// Request tracing for distributed logging
// ===========================================

import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        // Get correlation ID from header or generate new one
        const correlationId =
            (request.headers['x-correlation-id'] as string) ||
            `req-${uuidv4()}`;

        // Attach to request for use in other parts of the application
        (request as any).correlationId = correlationId;

        // Set response header
        response.setHeader('X-Correlation-ID', correlationId);

        return next.handle().pipe(
            tap(() => {
                // Correlation ID is already set in response headers
            }),
        );
    }
}
