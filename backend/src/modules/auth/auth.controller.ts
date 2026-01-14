// ===========================================
// Auth Controller
// Handles authentication endpoints
// ===========================================

import {
    Controller,
    Post,
    Body,
    Res,
    Req,
    HttpCode,
    HttpStatus,
    UseGuards,
    Get,
    UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { StudentAuthService } from './student-auth.service';
import { AdminAuthService } from './admin-auth.service';
import { StudentLoginDto } from './dto/student-login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { Public } from '@presentation/decorators/public.decorator';
import { RateLimit } from '@presentation/guards/rate-limit.guard';
import { JwtAuthService } from '@infrastructure/security/jwt.service';

@ApiTags('auth')
@Controller({
    path: 'auth',
    version: '1',
})
export class AuthController {
    constructor(
        private readonly studentAuthService: StudentAuthService,
        private readonly adminAuthService: AdminAuthService,
        private readonly jwtAuthService: JwtAuthService,
    ) { }

    // ===========================================
    // Student Authentication
    // ===========================================

    @Post('student/login')
    @Public()
    @HttpCode(HttpStatus.OK)
    @RateLimit({ limit: 5, windowSeconds: 300, blockDurationSeconds: 600, keyPrefix: 'login' })
    @ApiOperation({ summary: 'Student login with registration number and date of birth' })
    @ApiBody({ type: StudentLoginDto })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    @ApiResponse({ status: 429, description: 'Too many attempts' })
    async studentLogin(
        @Body() loginDto: StudentLoginDto,
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        const clientIp = this.getClientIp(request);
        const userAgent = request.get('user-agent') || '';

        const result = await this.studentAuthService.login(
            loginDto,
            clientIp,
            userAgent,
        );

        // Set HttpOnly cookies
        response.cookie(
            'student_access_token',
            result.tokens.accessToken,
            this.jwtAuthService.getCookieOptions('access'),
        );

        response.cookie(
            'student_refresh_token',
            result.tokens.refreshToken,
            this.jwtAuthService.getCookieOptions('refresh'),
        );

        return {
            success: true,
            message: 'تم تسجيل الدخول بنجاح', // Login successful
            student: result.student,
            accessToken: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
            expiresIn: result.tokens.expiresIn,
        };
    }

    @Post('student/logout')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Student logout' })
    @ApiResponse({ status: 200, description: 'Logout successful' })
    async studentLogout(@Res({ passthrough: true }) response: Response) {
        // Clear cookies
        response.clearCookie('student_access_token');
        response.clearCookie('student_refresh_token');

        return {
            success: true,
            message: 'تم تسجيل الخروج بنجاح', // Logout successful
        };
    }

    @Post('student/refresh')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh student access token' })
    @ApiResponse({ status: 200, description: 'Token refreshed' })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async studentRefreshToken(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        const refreshToken = request.cookies?.student_refresh_token || request.cookies?.refresh_token;

        if (!refreshToken) {
            throw new UnauthorizedException('No refresh token provided');
        }

        const result = await this.studentAuthService.refreshToken(refreshToken);

        // Set new access token cookie
        response.cookie(
            'student_access_token',
            result.accessToken,
            this.jwtAuthService.getCookieOptions('access'),
        );

        return {
            success: true,
            expiresIn: result.expiresIn,
        };
    }

    // ===========================================
    // Admin Authentication
    // ===========================================

    @Post('admin/login')
    @Public()
    @HttpCode(HttpStatus.OK)
    @RateLimit({ limit: 3, windowSeconds: 300, blockDurationSeconds: 1800, keyPrefix: 'admin-login' })
    @ApiOperation({ summary: 'Admin login with email and password' })
    @ApiBody({ type: AdminLoginDto })
    @ApiResponse({ status: 200, description: 'Login successful or MFA required' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    @ApiResponse({ status: 429, description: 'Too many attempts, account locked' })
    async adminLogin(
        @Body() loginDto: AdminLoginDto,
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        const clientIp = this.getClientIp(request);
        const userAgent = request.get('user-agent') || '';

        const result = await this.adminAuthService.login(
            loginDto,
            clientIp,
            userAgent,
        );

        // If MFA is required, return challenge
        if (result.requireMfa) {
            return {
                success: true,
                requireMfa: true,
                mfaToken: result.mfaToken,
                message: 'MFA verification required',
            };
        }

        // Set HttpOnly cookies
        response.cookie(
            'admin_access_token',
            result.tokens!.accessToken,
            this.jwtAuthService.getCookieOptions('access'),
        );

        response.cookie(
            'admin_refresh_token',
            result.tokens!.refreshToken,
            this.jwtAuthService.getCookieOptions('refresh'),
        );

        return {
            success: true,
            message: 'Login successful',
            admin: result.admin,
            expiresIn: result.tokens!.expiresIn,
        };
    }

    @Post('admin/mfa/verify')
    @Public()
    @HttpCode(HttpStatus.OK)
    @RateLimit({ limit: 3, windowSeconds: 60, blockDurationSeconds: 300, keyPrefix: 'mfa-verify' })
    @ApiOperation({ summary: 'Verify MFA code' })
    @ApiResponse({ status: 200, description: 'MFA verification successful' })
    @ApiResponse({ status: 401, description: 'Invalid MFA code' })
    async verifyMfa(
        @Body() body: { mfaToken: string; code: string },
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        const clientIp = this.getClientIp(request);
        const userAgent = request.get('user-agent') || '';

        const result = await this.adminAuthService.verifyMfa(
            body.mfaToken,
            body.code,
            clientIp,
            userAgent,
        );

        // Set HttpOnly cookies
        response.cookie(
            'admin_access_token',
            result.tokens.accessToken,
            this.jwtAuthService.getCookieOptions('access'),
        );

        response.cookie(
            'admin_refresh_token',
            result.tokens.refreshToken,
            this.jwtAuthService.getCookieOptions('refresh'),
        );

        return {
            success: true,
            message: 'MFA verification successful',
            admin: result.admin,
            expiresIn: result.tokens.expiresIn,
        };
    }

    @Post('admin/refresh')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh admin access token' })
    @ApiResponse({ status: 200, description: 'Token refreshed' })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async adminRefreshToken(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        const refreshToken = request.cookies?.admin_refresh_token || request.cookies?.refresh_token;

        if (!refreshToken) {
            throw new UnauthorizedException('No refresh token provided');
        }

        const result = await this.adminAuthService.refreshToken(refreshToken);

        // Set new access token cookie
        response.cookie(
            'admin_access_token',
            result.accessToken,
            this.jwtAuthService.getCookieOptions('access'),
        );

        return {
            success: true,
            expiresIn: result.expiresIn,
        };
    }

    @Post('admin/logout')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Admin logout' })
    @ApiResponse({ status: 200, description: 'Logout successful' })
    async adminLogout(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        const refreshToken = request.cookies?.admin_refresh_token;

        if (refreshToken) {
            await this.adminAuthService.logout(refreshToken);
        }

        // Clear cookies
        response.clearCookie('admin_access_token');
        response.clearCookie('admin_refresh_token');

        return {
            success: true,
            message: 'Logout successful',
        };
    }

    // ===========================================
    // Helper Methods
    // ===========================================

    private getClientIp(request: Request): string {
        const forwardedFor = request.headers['x-forwarded-for'];
        if (forwardedFor) {
            const ips = (forwardedFor as string).split(',');
            return ips[0].trim();
        }
        return request.ip || request.socket.remoteAddress || 'unknown';
    }
}
