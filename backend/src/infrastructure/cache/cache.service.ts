// ===========================================
// Cache Service - Redis Operations
// ===========================================

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(CacheService.name);
    private client: Redis;

    constructor(private readonly configService: ConfigService) {
        const redisUrl = this.configService.get<string>('REDIS_URL');
        const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

        if (!redisUrl && nodeEnv === 'production') {
            this.logger.warn('⚠️ No REDIS_URL provided in production. Caching will be disabled.');
            // We'll create a dummy client that doesn't connect
            this.client = new Redis({ lazyConnect: true, enableOfflineQueue: false });
        } else {
            this.client = new Redis(redisUrl || 'redis://localhost:6379', {
                maxRetriesPerRequest: 1,
                lazyConnect: true,
                reconnectOnError: () => false,
            });
        }
    }

    async onModuleInit() {
        const redisUrl = this.configService.get<string>('REDIS_URL');
        const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

        if (!redisUrl && nodeEnv === 'production') return;

        try {
            await this.client.connect();
            this.logger.log('✅ Redis connection established');
        } catch (error) {
            this.logger.warn('⚠️ Redis connection failed. Caching will be unavailable but system will continue to work.');
            // Don't log full error to keep logs clean
        }
    }

    async onModuleDestroy() {
        await this.client.quit();
        this.logger.log('Redis connection closed');
    }

    /**
     * Check if Redis is connected
     */
    isConnected(): boolean {
        return this.client.status === 'ready';
    }

    /**
     * Get a cached value
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.client.get(key);
            if (!value) return null;
            return JSON.parse(value) as T;
        } catch (error) {
            this.logger.warn(`Cache get error for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Set a cached value with optional TTL
     */
    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        try {
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                await this.client.setex(key, ttlSeconds, serialized);
            } else {
                await this.client.set(key, serialized);
            }
        } catch (error) {
            this.logger.warn(`Cache set error for key ${key}:`, error);
        }
    }

    /**
     * Delete a cached value
     */
    async del(key: string): Promise<void> {
        try {
            await this.client.del(key);
        } catch (error) {
            this.logger.warn(`Cache delete error for key ${key}:`, error);
        }
    }

    /**
     * Delete all keys matching a pattern
     */
    async delPattern(pattern: string): Promise<void> {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        } catch (error) {
            this.logger.warn(`Cache delete pattern error for ${pattern}:`, error);
        }
    }

    /**
     * Get or set with factory function
     */
    async getOrSet<T>(
        key: string,
        factory: () => Promise<T>,
        ttlSeconds: number = 300,
    ): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        const value = await factory();
        await this.set(key, value, ttlSeconds);
        return value;
    }

    /**
     * Increment a counter (for rate limiting)
     */
    async increment(key: string, ttlSeconds?: number): Promise<number> {
        try {
            const count = await this.client.incr(key);
            if (ttlSeconds && count === 1) {
                await this.client.expire(key, ttlSeconds);
            }
            return count;
        } catch (error) {
            this.logger.warn(`Cache increment error for key ${key}:`, error);
            return 0;
        }
    }

    /**
     * Get remaining TTL for a key
     */
    async getTTL(key: string): Promise<number> {
        try {
            return await this.client.ttl(key);
        } catch {
            return -1;
        }
    }

    // ===========================================
    // Cache Key Builders
    // ===========================================

    static keys = {
        studentResults: (studentId: string) => `student:results:${studentId}`,
        studentProfile: (studentId: string) => `student:profile:${studentId}`,
        loginAttempts: (ip: string) => `rate:login:${ip}`,
        apiRate: (ip: string) => `rate:api:${ip}`,
        adminSession: (adminId: string) => `admin:session:${adminId}`,
        semester: (semesterId: string) => `semester:${semesterId}`,
        activeSemester: () => 'semester:active',
    };
}
