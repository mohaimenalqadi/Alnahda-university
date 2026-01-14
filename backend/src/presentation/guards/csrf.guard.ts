// ===========================================
// CSRF Guard
// Protects against Cross-Site Request Forgery
// ===========================================

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class CsrfGuard implements CanActivate {
    /**
     * State-changing HTTP methods that require CSRF protection
     */
    private readonly protectedMethods = ['POST', 'PATCH', 'DELETE', 'PUT'];

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();

        // 1. If method is safe (GET, HEAD, OPTIONS), allow it
        if (!this.protectedMethods.includes(request.method)) {
            return true;
        }

        // 2. Check for the custom CSRF header
        // Since custom headers cannot be set by standard cross-site requests (forms/simple fetch),
        // the presence of this header proves the request originated from our approved client.
        const csrfHeader = request.headers['x-csrf-token'];

        if (!csrfHeader) {
            throw new ForbiddenException('CSRF validation failed: Missing custom header');
        }

        // Optional: Compare with a value from cookie if using Double Submit Cookie pattern
        // const csrfCookie = request.cookies['XSRF-TOKEN'];
        // if (csrfHeader !== csrfCookie) { ... }

        return true;
    }
}
