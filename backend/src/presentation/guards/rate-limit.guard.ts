// ===========================================
// Rate Limit Guard
// IP-based rate limiting with progressive delays
// ===========================================

import {
    Injectable,
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { CacheService } from '@infrastructure/cache/cache.service';

export interface RateLimitOptions {
    limit: number;
    windowSeconds: number;
    blockDurationSeconds?: number;
    keyPrefix?: string;
}

export const RATE_LIMIT_KEY = 'rate_limit';

@Injectable()
export class RateLimitGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly cacheService: CacheService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const options = this.reflector.get<RateLimitOptions>(
            RATE_LIMIT_KEY,
            context.getHandler(),
        );

        // If no rate limit configured, allow
        if (!options) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const clientIp = this.getClientIp(request);
        const keyPrefix = options.keyPrefix || 'rate';
        const key = `${keyPrefix}:${clientIp}`;

        // Check if IP is blocked
        const blockKey = `${key}:blocked`;
        const isBlocked = await this.cacheService.get<boolean>(blockKey);

        if (isBlocked) {
            const ttl = await this.cacheService.getTTL(blockKey);
            throw new HttpException(
                {
                    statusCode: HttpStatus.TOO_MANY_REQUESTS,
                    message: `Too many requests. Please try again in ${ttl} seconds.`,
                    retryAfter: ttl,
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        // Increment request count
        const count = await this.cacheService.increment(key, options.windowSeconds);

        // Check if limit exceeded
        if (count > options.limit) {
            const blockDuration = options.blockDurationSeconds || options.windowSeconds * 2;

            // Block the IP
            await this.cacheService.set(blockKey, true, blockDuration);

            throw new HttpException(
                {
                    statusCode: HttpStatus.TOO_MANY_REQUESTS,
                    message: `Rate limit exceeded. Blocked for ${blockDuration} seconds.`,
                    retryAfter: blockDuration,
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        return true;
    }

    private getClientIp(request: Request): string {
        // Check for forwarded IP (behind proxy/load balancer)
        const forwardedFor = request.headers['x-forwarded-for'];
        if (forwardedFor) {
            const ips = (forwardedFor as string).split(',');
            return ips[0].trim();
        }

        const realIp = request.headers['x-real-ip'];
        if (realIp) {
            return realIp as string;
        }

        return request.ip || request.socket.remoteAddress || 'unknown';
    }
}

/**
 * Rate limit decorator for controllers/handlers
 */
import { SetMetadata } from '@nestjs/common';

export const RateLimit = (options: RateLimitOptions) =>
    SetMetadata(RATE_LIMIT_KEY, options);
