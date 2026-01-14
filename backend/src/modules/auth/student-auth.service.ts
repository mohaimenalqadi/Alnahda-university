// ===========================================
// Student Auth Service
// Handles student authentication
// ===========================================

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { JwtAuthService, TokenPair } from '@infrastructure/security/jwt.service';
import { CryptoService } from '@infrastructure/security/crypto.service';
import { CacheService } from '@infrastructure/cache/cache.service';
import { StudentLoginDto } from './dto/student-login.dto';

interface StudentLoginResult {
    tokens: TokenPair;
    student: {
        id: string;
        fullNameAr: string;
        fullNameEn: string;
        registrationNumberPrefix: string;
        departmentNameAr: string;
        departmentNameEn: string;
    };
}

@Injectable()
export class StudentAuthService {
    private readonly logger = new Logger(StudentAuthService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtAuthService: JwtAuthService,
        private readonly cryptoService: CryptoService,
        private readonly cacheService: CacheService,
    ) { }

    /**
     * Authenticate student with registration number and date of birth
     */
    async login(
        dto: StudentLoginDto,
        clientIp: string,
        userAgent: string,
    ): Promise<StudentLoginResult> {
        // Hash the registration number for lookup
        const registrationHash = this.cryptoService.hashSHA256(dto.registrationNumber);

        // Find student identifier
        const identifier = await this.prisma.studentIdentifier.findUnique({
            where: { registrationNumberHash: registrationHash },
            include: {
                student: {
                    include: {
                        department: true,
                    },
                },
            },
        });

        // Use timing-safe comparison to prevent timing attacks
        // Even if student not found, perform a dummy comparison
        const dummyDate = new Date('1900-01-01');
        const storedDob = identifier?.student?.dateOfBirth || dummyDate;
        const inputDob = new Date(dto.dateOfBirth);

        // Convert to comparable string format
        const storedDobStr = storedDob.toISOString().split('T')[0];
        const inputDobStr = inputDob.toISOString().split('T')[0];

        // Timing-safe comparison
        const dobMatches = this.cryptoService.timingSafeEqual(storedDobStr, inputDobStr);

        // Log login attempt
        await this.logLoginAttempt(
            identifier?.studentId || null,
            clientIp,
            userAgent,
            !!(identifier && dobMatches && identifier.student.status === 'ACTIVE'),
            !identifier ? 'STUDENT_NOT_FOUND' : !dobMatches ? 'DOB_MISMATCH' :
                identifier.student.status !== 'ACTIVE' ? 'INACTIVE_ACCOUNT' : null,
        );

        // Validate - use generic error message to prevent user enumeration
        if (!identifier || !dobMatches) {
            throw new UnauthorizedException('بيانات الدخول غير صحيحة'); // Invalid credentials
        }

        const student = identifier.student;

        // Check if student is active
        if (student.status !== 'ACTIVE') {
            throw new UnauthorizedException('الحساب غير مفعل'); // Account inactive
        }

        // Check if soft deleted
        if (student.deletedAt) {
            throw new UnauthorizedException('بيانات الدخول غير صحيحة'); // Invalid credentials
        }

        // Generate tokens
        const tokens = await this.jwtAuthService.generateTokenPair({
            sub: student.id,
            type: 'student',
        });

        this.logger.log(`Student login successful: ${student.id} from ${clientIp}`);

        return {
            tokens,
            student: {
                id: student.id,
                fullNameAr: student.fullNameAr,
                fullNameEn: student.fullNameEn,
                registrationNumberPrefix: identifier.registrationNumberPrefix,
                departmentNameAr: student.department.nameAr,
                departmentNameEn: student.department.nameEn,
            },
        };
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        expiresIn: number;
    }> {
        const payload = await this.jwtAuthService.verifyRefreshToken(refreshToken);

        if (payload.type !== 'student') {
            throw new UnauthorizedException('Invalid token type');
        }

        // Verify student still exists and is active
        const student = await this.prisma.student.findUnique({
            where: { id: payload.sub },
        });

        if (!student || student.status !== 'ACTIVE' || student.deletedAt) {
            throw new UnauthorizedException('Account no longer active');
        }

        const accessToken = await this.jwtAuthService.generateAccessToken({
            sub: student.id,
            type: 'student',
        });

        return {
            accessToken,
            expiresIn: 900, // 15 minutes
        };
    }

    /**
     * Log login attempt for security auditing
     */
    private async logLoginAttempt(
        studentId: string | null,
        ipAddress: string,
        userAgent: string,
        success: boolean,
        failureReason: string | null,
    ): Promise<void> {
        try {
            await this.prisma.loginAttempt.create({
                data: {
                    studentId,
                    ipAddress,
                    userAgent: userAgent.substring(0, 500), // Limit length
                    success,
                    failureReason,
                },
            });
        } catch (error) {
            this.logger.error('Failed to log login attempt:', error);
        }
    }
}
