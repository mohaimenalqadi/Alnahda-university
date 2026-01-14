// ===========================================
// Global Exception Filter
// Centralized error handling with correlation IDs
// ===========================================

import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
    statusCode: number;
    message: string;
    error: string;
    timestamp: string;
    path: string;
    correlationId?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const correlationId = (request as any).correlationId || 'unknown';

        let status: number;
        let message: string;
        let error: string;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
                error = exception.name;
            } else if (typeof exceptionResponse === 'object') {
                const resp = exceptionResponse as Record<string, any>;
                message = resp.message || exception.message;
                error = resp.error || exception.name;

                // Handle validation errors (array of messages)
                if (Array.isArray(message)) {
                    message = message.join(', ');
                }
            } else {
                message = exception.message;
                error = exception.name;
            }
        } else if (exception instanceof Error) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = exception.message; // Exposed for debugging
            error = exception.name;

            // Log the actual error for debugging (not exposed to client)
            this.logger.error(
                `[${correlationId}] Unhandled exception: ${exception.message}`,
                exception.stack,
            );
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'An unexpected error occurred';
            error = 'Internal Server Error';

            this.logger.error(`[${correlationId}] Unknown exception type:`, exception);
        }

        // Security: Don't expose sensitive error details in production
        // MOIFIED FOR DEBUGGING: Exposing actual message even in production
        if (process.env.NODE_ENV === 'production') {
            // Generic messages for common security-sensitive errors
            if (status === HttpStatus.UNAUTHORIZED) {
                message = 'Authentication required';
            } else if (status === HttpStatus.FORBIDDEN) {
                message = 'Access denied';
            } else if (status >= 500) {
                // message = 'An error occurred. Please try again later.';
            }
        }

        const errorResponse: ErrorResponse = {
            statusCode: status,
            message,
            error,
            timestamp: new Date().toISOString(),
            path: request.url,
            correlationId,
        };

        // Log client errors at warn level, server errors at error level
        if (status >= 500) {
            this.logger.error(
                `[${correlationId}] ${request.method} ${request.url} - ${status}`,
                { error: message, stack: exception instanceof Error ? exception.stack : undefined },
            );
        } else if (status >= 400) {
            this.logger.warn(
                `[${correlationId}] ${request.method} ${request.url} - ${status}: ${message}`,
            );
        }

        response.status(status).json(errorResponse);
    }
}
