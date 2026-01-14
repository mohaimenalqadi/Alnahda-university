// ===========================================
// Security Module - Crypto & JWT Services
// ===========================================

import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CryptoService } from './crypto.service';
import { JwtAuthService } from './jwt.service';

@Global()
@Module({
    imports: [
        JwtModule.registerAsync({
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_ACCESS_SECRET') || configService.get<string>('JWT_SECRET', 'dev_secret_fallback'),
                signOptions: {
                    expiresIn: configService.get<string>('JWT_ACCESS_EXPIRY', '15m'),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [CryptoService, JwtAuthService],
    exports: [CryptoService, JwtAuthService, JwtModule],
})
export class SecurityModule { }
