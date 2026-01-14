// ===========================================
// Al-Nahda University - Root Application Module
// ===========================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CqrsModule } from '@nestjs/cqrs';

// Infrastructure modules
import { DatabaseModule } from './infrastructure/database/database.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { SecurityModule } from './infrastructure/security/security.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { StudentModule } from './modules/student/student.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditModule } from './modules/audit/audit.module';

import { AppController } from './presentation/controllers/app.controller';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),

        // Rate limiting
        ThrottlerModule.forRoot([
            {
                name: 'short',
                ttl: 1000,
                limit: 3,
            },
            {
                name: 'medium',
                ttl: 10000,
                limit: 20,
            },
            {
                name: 'long',
                ttl: 60000,
                limit: 100,
            },
        ]),

        // CQRS for clean architecture
        CqrsModule,

        // Infrastructure
        DatabaseModule,
        CacheModule,
        SecurityModule,

        // Feature modules
        AuthModule,
        StudentModule,
        AdminModule,
        AuditModule,
    ],
    controllers: [AppController],
    providers: [],
})
export class AppModule { }
