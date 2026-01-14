// ===========================================
// Student Login DTO
// ===========================================

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsNotEmpty, Matches } from 'class-validator';

export class StudentLoginDto {
    @ApiProperty({
        description: 'Student registration number (رقم القيد)',
        example: '2024-CS-001',
    })
    @IsString()
    @IsNotEmpty({ message: 'رقم القيد مطلوب' })
    @Matches(/^[0-9]+$/, {
        message: 'صيغة رقم القيد غير صحيحة',
    })
    registrationNumber!: string;

    @ApiProperty({
        description: 'Student date of birth (تاريخ الميلاد)',
        example: '2002-05-15',
    })
    @IsDateString({}, { message: 'صيغة تاريخ الميلاد غير صحيحة' }) // Invalid date format
    @IsNotEmpty({ message: 'تاريخ الميلاد مطلوب' }) // Date of birth is required
    dateOfBirth!: string;
}
