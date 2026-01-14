// ===========================================
// JWT Service - Token Management
// ===========================================

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CryptoService } from './crypto.service';

export interface TokenPayload {
    sub: string;
    type: 'student' | 'admin';
    email?: string;
    roles?: string[];
    permissions?: string[];
    iat?: number;
    exp?: number;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

@Injectable()
export class JwtAuthService {
    private readonly accessTokenExpiry: string;
    private readonly refreshTokenExpiry: string;
    private readonly refreshTokenSecret: string;

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly cryptoService: CryptoService,
    ) {
        this.accessTokenExpiry = this.configService.get<string>('JWT_ACCESS_EXPIRY', '15m');
        this.refreshTokenExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d');
        this.refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET', '');
    }

    /**
     * Generate access and refresh token pair
     */
    async generateTokenPair(payload: TokenPayload): Promise<TokenPair> {
        const accessToken = await this.generateAccessToken(payload);
        const refreshToken = await this.generateRefreshToken(payload);

        return {
            accessToken,
            refreshToken,
            expiresIn: this.getExpiryInSeconds(this.accessTokenExpiry),
        };
    }

    /**
     * Generate access token
     */
    async generateAccessToken(payload: TokenPayload): Promise<string> {
        return this.jwtService.signAsync(payload, {
            expiresIn: this.accessTokenExpiry,
        });
    }

    /**
     * Generate refresh token
     */
    async generateRefreshToken(payload: TokenPayload): Promise<string> {
        return this.jwtService.signAsync(
            { sub: payload.sub, type: payload.type },
            {
                secret: this.refreshTokenSecret,
                expiresIn: this.refreshTokenExpiry,
            },
        );
    }

    /**
     * Verify access token
     */
    async verifyAccessToken(token: string): Promise<TokenPayload> {
        try {
            return await this.jwtService.verifyAsync<TokenPayload>(token);
        } catch (error: any) {
            throw new UnauthorizedException('Invalid or expired access token');
        }
    }

    /**
     * Verify refresh token
     */
    async verifyRefreshToken(token: string): Promise<TokenPayload> {
        try {
            return await this.jwtService.verifyAsync<TokenPayload>(token, {
                secret: this.refreshTokenSecret,
            });
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    /**
     * Decode token without verification (for extracting claims)
     */
    decodeToken(token: string): TokenPayload | null {
        try {
            return this.jwtService.decode(token) as TokenPayload;
        } catch {
            return null;
        }
    }

    /**
     * Hash refresh token for database storage
     */
    hashRefreshToken(token: string): string {
        return this.cryptoService.hashToken(token);
    }

    /**
     * Convert expiry string to seconds
     */
    private getExpiryInSeconds(expiry: string): number {
        const match = expiry.match(/^(\d+)([smhd])$/);
        if (!match) return 900; // Default 15 minutes

        const value = parseInt(match[1], 10);
        const unit = match[2];

        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 3600;
            case 'd': return value * 86400;
            default: return 900;
        }
    }

    /**
     * Get cookie options for tokens
     */
    getCookieOptions(type: 'access' | 'refresh'): {
        httpOnly: boolean;
        secure: boolean;
        sameSite: 'strict' | 'lax' | 'none';
        maxAge: number;
        path: string;
    } {
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        const expiry = type === 'access' ? this.accessTokenExpiry : this.refreshTokenExpiry;

        return {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: this.getExpiryInSeconds(expiry) * 1000,
            path: '/', // Both tokens need to be accessible from all paths
        };
    }
}
