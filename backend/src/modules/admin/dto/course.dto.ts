import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsUUID, IsOptional, Min, Max } from 'class-validator';

export class CreateCourseDto {
    @ApiProperty()
    @IsString()
    code!: string;

    @ApiProperty()
    @IsString()
    nameAr!: string;

    @ApiProperty()
    @IsString()
    nameEn!: string;

    @ApiProperty()
    @IsUUID()
    departmentId!: string;

    @ApiProperty({ description: 'Semester level (1-10)' })
    @IsInt()
    @Min(1)
    @Max(10)
    semesterLevel!: number;

    @ApiPropertyOptional({ default: 3 })
    @IsInt()
    @IsOptional()
    units?: number = 3;
}

export class UpdateCourseDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    code?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    nameAr?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    nameEn?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(10)
    semesterLevel?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    departmentId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    units?: number;
}
