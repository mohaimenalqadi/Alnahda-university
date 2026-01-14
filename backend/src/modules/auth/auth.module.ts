// ===========================================
// Auth Module
// Authentication for students and admins
// ===========================================

import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { StudentAuthService } from './student-auth.service';
import { AdminAuthService } from './admin-auth.service';

@Module({
    controllers: [AuthController],
    providers: [AuthService, StudentAuthService, AdminAuthService],
    exports: [AuthService, StudentAuthService, AdminAuthService],
})
export class AuthModule { }
