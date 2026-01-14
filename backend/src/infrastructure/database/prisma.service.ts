// ===========================================
// Prisma Service - Database Connection
// ===========================================

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            log: [
                { emit: 'event', level: 'query' },
                { emit: 'stdout', level: 'info' },
                { emit: 'stdout', level: 'warn' },
                { emit: 'stdout', level: 'error' },
            ],
            errorFormat: 'colorless',
        });
    }

    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('✅ Database connection established');

            // Log slow queries in development
            if (process.env.NODE_ENV === 'development') {
                // @ts-ignore - Prisma event typing issue
                this.$on('query', (e: Prisma.QueryEvent) => {
                    if (e.duration > 100) {
                        this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
                    }
                });
            }
        } catch (error) {
            this.logger.error('❌ Database connection failed', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('Database connection closed');
    }

    /**
     * Health check for database connection
     */
    async isHealthy(): Promise<boolean> {
        try {
            await this.$queryRaw`SELECT 1`;
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Execute operations in a transaction with retry logic
     */
    async executeInTransaction<T>(
        operations: (tx: Prisma.TransactionClient) => Promise<T>,
        maxRetries: number = 3,
    ): Promise<T> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.$transaction(operations, {
                    maxWait: 5000,
                    timeout: 10000,
                    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
                });
            } catch (error) {
                lastError = error as Error;
                this.logger.warn(`Transaction attempt ${attempt} failed: ${lastError.message}`);

                // Only retry on serialization failures
                if (!lastError.message.includes('could not serialize')) {
                    throw error;
                }

                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
            }
        }

        throw lastError;
    }

    /**
     * Soft delete helper - sets deletedAt timestamp
     */
    async softDelete<T extends { deletedAt: Date | null }>(
        model: string,
        id: string,
    ): Promise<void> {
        // @ts-ignore - Dynamic model access
        await this[model].update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    /**
     * Check if a record exists
     */
    async exists(model: string, where: Record<string, unknown>): Promise<boolean> {
        // @ts-ignore - Dynamic model access
        const count = await this[model].count({ where });
        return count > 0;
    }
}
