// ===========================================
// Admin Auth Service
// Handles admin authentication with MFA
// ===========================================

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { JwtAuthService, TokenPair } from '@infrastructure/security/jwt.service';
import { CryptoService } from '@infrastructure/security/crypto.service';
import { CacheService } from '@infrastructure/cache/cache.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { authenticator } from 'otplib';

// Define AuditAction locally to avoid Prisma client dependency
type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW';

export interface AdminInfo {
    id: string;
    email: string;
    fullName: string;
    roles: string[];
    permissions: string[];
}

export interface AdminLoginResult {
    requireMfa: boolean;
    mfaToken?: string;
    tokens?: TokenPair;
    admin?: AdminInfo;
}

@Injectable()
export class AdminAuthService {
    private readonly logger = new Logger(AdminAuthService.name);
    private readonly MAX_FAILED_ATTEMPTS = 5;
    private readonly LOCKOUT_DURATION_MINUTES = 30;

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtAuthService: JwtAuthService,
        private readonly cryptoService: CryptoService,
        private readonly cacheService: CacheService,
    ) { }

    /**
     * Authenticate admin with email and password
     */
    async login(
        dto: AdminLoginDto,
        clientIp: string,
        userAgent: string,
    ): Promise<AdminLoginResult> {
        // Find admin user
        const admin = await this.prisma.adminUser.findUnique({
            where: { email: dto.email.toLowerCase() },
            include: {
                roles: {
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: {
                                        permission: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Check if account is locked
        if (admin?.lockedUntil && admin.lockedUntil > new Date()) {
            const remainingMinutes = Math.ceil(
                (admin.lockedUntil.getTime() - Date.now()) / 60000,
            );
            throw new UnauthorizedException(
                `Account locked. Try again in ${remainingMinutes} minutes.`,
            );
        }

        // Verify password
        let passwordValid = false;
        if (admin) {
            passwordValid = await this.cryptoService.verifyPassword(
                admin.passwordHash,
                dto.password,
            );
        } else {
            // Perform dummy hash to prevent timing attacks
            await this.cryptoService.hashPassword('dummy');
        }

        if (!admin || !passwordValid) {
            // Record failed attempt
            if (admin) {
                await this.recordFailedAttempt(admin.id);
            }

            await this.logAuditEvent(
                admin?.id || null,
                'LOGIN',
                'admin_user',
                admin?.id || null,
                null,
                { success: false, reason: !admin ? 'USER_NOT_FOUND' : 'INVALID_PASSWORD' },
                clientIp,
                userAgent,
            );

            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if account is active
        if (!admin.isActive) {
            throw new UnauthorizedException('Account is disabled');
        }

        // Reset failed attempts on successful password verification
        await this.clearFailedAttempts(admin.id);

        // Check if MFA is required
        if (admin.mfaEnabled && admin.mfaSecret) {
            // Generate temporary MFA token
            const mfaToken = this.cryptoService.generateRandomString(32);

            // Store MFA session temporarily (5 minutes)
            await this.cacheService.set(
                `mfa:session:${mfaToken}`,
                { adminId: admin.id, ip: clientIp },
                300,
            );

            return {
                requireMfa: true,
                mfaToken,
            };
        }

        // No MFA required, complete login
        const result = await this.completeLogin(admin, clientIp, userAgent);
        return {
            requireMfa: false,
            tokens: result.tokens,
            admin: result.admin,
        };
    }

    /**
     * Verify MFA code and complete login
     */
    async verifyMfa(
        mfaToken: string,
        code: string,
        clientIp: string,
        userAgent: string,
    ): Promise<{ tokens: TokenPair; admin: AdminInfo }> {
        // Get MFA session
        const session = await this.cacheService.get<{ adminId: string; ip: string }>(
            `mfa:session:${mfaToken}`,
        );

        if (!session) {
            throw new UnauthorizedException('MFA session expired');
        }

        // Verify IP matches (optional security measure)
        if (session.ip !== clientIp) {
            this.logger.warn(
                `MFA IP mismatch for admin ${session.adminId}: expected ${session.ip}, got ${clientIp}`,
            );
        }

        // Get admin
        const admin = await this.prisma.adminUser.findUnique({
            where: { id: session.adminId },
            include: {
                roles: {
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: {
                                        permission: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!admin || !admin.mfaSecret) {
            throw new UnauthorizedException('Invalid MFA session');
        }

        // Verify TOTP code
        const isValid = authenticator.verify({
            token: code,
            secret: admin.mfaSecret,
        });

        if (!isValid) {
            await this.logAuditEvent(
                admin.id,
                'LOGIN',
                'admin_user',
                admin.id,
                null,
                { success: false, reason: 'INVALID_MFA' },
                clientIp,
                userAgent,
            );

            throw new UnauthorizedException('Invalid MFA code');
        }

        // Clear MFA session
        await this.cacheService.del(`mfa:session:${mfaToken}`);

        return this.completeLogin(admin, clientIp, userAgent);
    }

    /**
     * Refresh admin access token
     */
    async refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        expiresIn: number;
    }> {
        const payload = await this.jwtAuthService.verifyRefreshToken(refreshToken);

        if (payload.type !== 'admin') {
            throw new UnauthorizedException('Invalid token type');
        }

        // Check if refresh token exists and is not revoked in DB
        const tokenHash = this.jwtAuthService.hashRefreshToken(refreshToken);
        const storedToken = await this.prisma.refreshToken.findFirst({
            where: {
                tokenHash,
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
        });

        if (!storedToken) {
            throw new UnauthorizedException('Refresh token is invalid or revoked');
        }

        // Get admin with roles and permissions
        const admin = await this.prisma.adminUser.findUnique({
            where: { id: payload.sub },
            include: {
                roles: {
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: {
                                        permission: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!admin || !admin.isActive) {
            throw new UnauthorizedException('Admin account no longer active');
        }

        // Extract roles and permissions
        const roles = admin.roles.map((r: any) => r.role.name);
        const permissions = new Set<string>();

        admin.roles.forEach((r: any) => {
            r.role.permissions.forEach((p: any) => {
                permissions.add(p.permission.name);
            });
        });

        const accessToken = await this.jwtAuthService.generateAccessToken({
            sub: admin.id,
            type: 'admin',
            email: admin.email,
            roles,
            permissions: Array.from(permissions),
        });

        return {
            accessToken,
            expiresIn: 900, // 15 minutes
        };
    }

    /**
     * Complete login after all verification
     */
    private async completeLogin(
        admin: any, // Prisma type with relations
        clientIp: string,
        userAgent: string,
    ): Promise<{ tokens: TokenPair; admin: AdminInfo }> {
        // Extract roles and permissions
        const roles = admin.roles.map((r: any) => r.role.name);
        const permissions = new Set<string>();

        admin.roles.forEach((r: any) => {
            r.role.permissions.forEach((p: any) => {
                permissions.add(p.permission.name);
            });
        });

        // Generate tokens
        const tokens = await this.jwtAuthService.generateTokenPair({
            sub: admin.id,
            type: 'admin',
            email: admin.email,
            roles,
            permissions: Array.from(permissions),
        });

        // Store refresh token hash
        await this.prisma.refreshToken.create({
            data: {
                adminUserId: admin.id,
                tokenHash: this.jwtAuthService.hashRefreshToken(tokens.refreshToken),
                ipAddress: clientIp,
                deviceInfo: userAgent.substring(0, 500),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        // Update last login
        await this.prisma.adminUser.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() },
        });

        // Log successful login
        await this.logAuditEvent(
            admin.id,
            'LOGIN',
            'admin_user',
            admin.id,
            null,
            { success: true },
            clientIp,
            userAgent,
        );

        this.logger.log(`Admin login successful: ${admin.email} from ${clientIp}`);

        return {
            tokens,
            admin: {
                id: admin.id,
                email: admin.email,
                fullName: admin.fullName,
                roles,
                permissions: Array.from(permissions),
            },
        };
    }

    /**
     * Logout and invalidate refresh token
     */
    async logout(refreshToken: string): Promise<void> {
        const tokenHash = this.jwtAuthService.hashRefreshToken(refreshToken);

        await this.prisma.refreshToken.updateMany({
            where: { tokenHash },
            data: { revokedAt: new Date() },
        });
    }

    /**
     * Record failed login attempt
     */
    private async recordFailedAttempt(adminId: string): Promise<void> {
        const admin = await this.prisma.adminUser.update({
            where: { id: adminId },
            data: {
                failedLoginAttempts: { increment: 1 },
            },
        });

        // Lock account if max attempts exceeded
        if (admin.failedLoginAttempts >= this.MAX_FAILED_ATTEMPTS) {
            await this.prisma.adminUser.update({
                where: { id: adminId },
                data: {
                    lockedUntil: new Date(
                        Date.now() + this.LOCKOUT_DURATION_MINUTES * 60 * 1000,
                    ),
                },
            });

            this.logger.warn(`Admin account locked: ${adminId}`);
        }
    }

    /**
     * Clear failed login attempts
     */
    private async clearFailedAttempts(adminId: string): Promise<void> {
        await this.prisma.adminUser.update({
            where: { id: adminId },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
            },
        });
    }

    /**
     * Log audit event
     */
    private async logAuditEvent(
        adminUserId: string | null,
        action: AuditAction,
        resource: string,
        resourceId: string | null,
        oldValues: any,
        newValues: any,
        ipAddress: string,
        userAgent: string,
    ): Promise<void> {
        try {
            await this.prisma.auditLog.create({
                data: {
                    adminUserId,
                    action,
                    resource,
                    resourceId,
                    oldValues,
                    newValues,
                    ipAddress,
                    userAgent: userAgent.substring(0, 500),
                    correlationId: this.cryptoService.generateUUID(),
                },
            });
        } catch (error) {
            this.logger.error('Failed to create audit log:', error);
        }
    }
}
