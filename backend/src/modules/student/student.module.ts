// ===========================================
// Student Module
// Student results access
// ===========================================

import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { GPACalculatorService } from '@domain/grade/services/gpa-calculator.service';

@Module({
    controllers: [StudentController],
    providers: [StudentService, GPACalculatorService],
    exports: [StudentService],
})
export class StudentModule { }
