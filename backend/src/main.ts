// ===========================================
// Al-Nahda University - Main Application Entry
// ===========================================

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './presentation/filters/global-exception.filter';
import { CorrelationIdInterceptor } from './presentation/interceptors/correlation-id.interceptor';
import { LoggingInterceptor } from './presentation/interceptors/logging.interceptor';
import { CsrfGuard } from './presentation/guards/csrf.guard';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT', 4000);
    const corsOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:3000');

    // Security middleware
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        },
        crossOriginEmbedderPolicy: false,
    }));

    // Cookie parser for JWT tokens
    app.use(cookieParser());

    // CORS configuration
    app.enableCors({
        origin: corsOrigins.split(',').map(origin => origin.trim()),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-CSRF-Token'],
    });

    // API versioning
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
        prefix: 'api/v',
    });

    // Global validation pipe with Zod-like strictness
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Global CSRF Protection
    app.useGlobalGuards(new CsrfGuard());

    // Global interceptors
    app.useGlobalInterceptors(
        new CorrelationIdInterceptor(),
        new LoggingInterceptor(),
    );

    // Swagger API documentation
    const swaggerConfig = new DocumentBuilder()
        .setTitle('Al-Nahda University API')
        .setDescription('Secure Student Results Management System API')
        .setVersion('1.0')
        .addTag('auth', 'Authentication endpoints')
        .addTag('students', 'Student result endpoints')
        .addTag('admin', 'Admin management endpoints')
        .addCookieAuth('admin_access_token')
        .addCookieAuth('student_access_token')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });

    // Graceful shutdown
    app.enableShutdownHooks();

    await app.listen(port);

    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║      Al-Nahda University - Student Results API                ║
║      SYSTEM REBOOTED - VERSION: [DEBUG_777_PUBLISH_FIX]       ║
╚═══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
