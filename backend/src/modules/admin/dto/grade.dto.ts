// ===========================================
// Grade DTOs
// ===========================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, Min, Max, IsOptional, IsString } from 'class-validator';

export class CreateGradeDto {
    @ApiPropertyOptional({ description: 'Enrollment ID' })
    @IsOptional()
    @IsUUID()
    enrollmentId?: string;

    @ApiPropertyOptional({ description: 'Student ID' })
    @IsOptional()
    @IsUUID()
    studentId?: string;

    @ApiPropertyOptional({ description: 'Course ID' })
    @IsOptional()
    @IsUUID()
    courseId?: string;

    @ApiPropertyOptional({ description: 'Semester ID' })
    @IsOptional()
    @IsUUID()
    semesterId?: string;

    @ApiProperty({ description: 'Coursework score', example: 35 })
    @IsNumber()
    @Min(0)
    @Max(40)
    courseworkScore!: number;

    @ApiProperty({ description: 'Final exam score', example: 50 })
    @IsNumber()
    @Min(0)
    @Max(60)
    finalExamScore!: number;
}

export class UpdateGradeDto {
    @ApiPropertyOptional({ description: 'Updated coursework score' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(40)
    courseworkScore?: number;

    @ApiPropertyOptional({ description: 'Updated final exam score' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(60)
    finalExamScore?: number;

    @ApiPropertyOptional({ description: 'Reason for change' })
    @IsOptional()
    @IsString()
    changeReason?: string;
}

export class PublishGradesDto {
    @ApiProperty({ description: 'Semester ID to publish grades for' })
    @IsUUID()
    semesterId!: string;

    @ApiPropertyOptional({ description: 'Optional Student ID to publish grades for specifically' })
    @IsOptional()
    @IsUUID()
    studentId?: string;
}
