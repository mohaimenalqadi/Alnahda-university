import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsEmail, IsOptional, IsInt, IsDateString, IsEnum } from 'class-validator';
import { StudentStatus } from '@prisma/client';

export class CreateStudentDto {
    @ApiProperty()
    @IsString()
    fullNameAr!: string;

    @ApiProperty()
    @IsString()
    fullNameEn!: string;

    @ApiProperty()
    @IsDateString()
    dateOfBirth!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty()
    @IsUUID()
    departmentId!: string;

    @ApiProperty()
    @IsInt()
    academicYear!: number;

    @ApiProperty({ description: 'Registration number' })
    @IsString()
    registrationNumber!: string;

    @ApiProperty({ description: 'Current semester level (1-10)' })
    @IsInt()
    @IsOptional()
    semesterLevel?: number;
}

export class UpdateStudentDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    fullNameAr?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    fullNameEn?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    dateOfBirth?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    departmentId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    academicYear?: number;

    @ApiPropertyOptional({ description: 'Current semester level (1-10)' })
    @IsOptional()
    @IsInt()
    semesterLevel?: number;

    @ApiPropertyOptional({ description: 'Registration number' })
    @IsOptional()
    @IsString()
    registrationNumber?: string;

    @ApiPropertyOptional({ enum: StudentStatus })
    @IsOptional()
    @IsEnum(StudentStatus)
    status?: StudentStatus;
}
