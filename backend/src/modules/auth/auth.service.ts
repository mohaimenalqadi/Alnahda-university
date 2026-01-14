// ===========================================
// Auth Service
// Base authentication service
// ===========================================

import { Injectable } from '@nestjs/common';
import { JwtAuthService } from '@infrastructure/security/jwt.service';
import { CryptoService } from '@infrastructure/security/crypto.service';
import { CacheService } from '@infrastructure/cache/cache.service';

@Injectable()
export class AuthService {
    constructor(
        protected readonly jwtAuthService: JwtAuthService,
        protected readonly cryptoService: CryptoService,
        protected readonly cacheService: CacheService,
    ) { }

    /**
     * Check if an IP has exceeded login attempts
     */
    async checkLoginAttempts(ip: string, maxAttempts: number = 5): Promise<{
        allowed: boolean;
        attempts: number;
        blockTimeRemaining?: number;
    }> {
        const blockKey = `login:blocked:${ip}`;
        const attemptsKey = `login:attempts:${ip}`;

        // Check if blocked
        const isBlocked = await this.cacheService.get<boolean>(blockKey);
        if (isBlocked) {
            const ttl = await this.cacheService.getTTL(blockKey);
            return {
                allowed: false,
                attempts: maxAttempts,
                blockTimeRemaining: ttl,
            };
        }

        // Get current attempts
        const attempts = await this.cacheService.get<number>(attemptsKey) || 0;

        return {
            allowed: attempts < maxAttempts,
            attempts,
        };
    }

    /**
     * Record a failed login attempt
     */
    async recordFailedAttempt(ip: string, maxAttempts: number = 5): Promise<void> {
        const attemptsKey = `login:attempts:${ip}`;
        const blockKey = `login:blocked:${ip}`;

        const attempts = await this.cacheService.increment(attemptsKey, 3600); // 1 hour window

        if (attempts >= maxAttempts) {
            // Block IP for progressive duration
            const blockDuration = Math.min(attempts * 60, 1800); // Max 30 minutes
            await this.cacheService.set(blockKey, true, blockDuration);
        }
    }

    /**
     * Clear login attempts after successful login
     */
    async clearLoginAttempts(ip: string): Promise<void> {
        await this.cacheService.del(`login:attempts:${ip}`);
        await this.cacheService.del(`login:blocked:${ip}`);
    }
}
