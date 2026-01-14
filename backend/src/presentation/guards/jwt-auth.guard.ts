// ===========================================
// JWT Authentication Guard
// Validates access tokens from cookies or headers
// ===========================================

import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwtAuthService, TokenPayload } from '@infrastructure/security/jwt.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly jwtAuthService: JwtAuthService,
        private readonly reflector: Reflector,
    ) { }

    private logDebug(message: string) {
        const logPath = path.join(process.cwd(), 'auth-debug.log');
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Check if route is marked as public
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractToken(request);

        if (!token) {
            this.logDebug(`[FAIL] No token found for ${request.method} ${request.url}`);
            throw new UnauthorizedException('No authentication token provided');
        }

        try {
            const payload = await this.jwtAuthService.verifyAccessToken(token);
            // Attach user to request
            (request as any).user = payload;
            return true;
        } catch (error: any) {
            this.logDebug(`[FAIL] Verification failed for ${request.url}: ${error.message}`);
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    private extractToken(request: Request): string | undefined {
        const url = request.url || '';
        const path = request.path || '';
        const cookies = request.cookies || {};

        // Broad check for admin anywhere in the path or URL
        const isAdminRoute = url.includes('admin') || path.includes('admin');
        const primaryCookie = isAdminRoute ? 'admin_access_token' : 'student_access_token';
        const secondaryCookie = isAdminRoute ? 'student_access_token' : 'admin_access_token';

        this.logDebug(`[DEBUG] Extraction for ${url}. isAdminRoute: ${isAdminRoute}, Primary: ${primaryCookie}`);

        // 1. Try preferred specific HttpOnly cookie
        if (cookies[primaryCookie]) {
            this.logDebug(`[SUCCESS] Found primary cookie: ${primaryCookie}`);
            return cookies[primaryCookie];
        }

        // 2. Try secondary specific cookie (maybe user is using one session for both)
        if (cookies[secondaryCookie]) {
            this.logDebug(`[SUCCESS] Found secondary cookie: ${secondaryCookie}`);
            return cookies[secondaryCookie];
        }

        // 3. Fallback to generic access_token (legacy)
        if (cookies['access_token']) {
            this.logDebug(`[FALLBACK] Found generic access_token cookie`);
            return cookies['access_token'];
        }

        // 4. Fallback to Authorization header
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            this.logDebug(`[SUCCESS] Found Bearer token in header`);
            return authHeader.substring(7);
        }

        this.logDebug(`[FAIL] No token found in any common locations`);
        return undefined;
    }
}
