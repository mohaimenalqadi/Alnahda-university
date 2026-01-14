// ===========================================
// Admin Module
// Admin dashboard and management
// ===========================================

import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { GPACalculatorService } from '@domain/grade/services/gpa-calculator.service';

@Module({
    controllers: [AdminController],
    providers: [AdminService, GPACalculatorService],
    exports: [AdminService],
})
export class AdminModule { }
