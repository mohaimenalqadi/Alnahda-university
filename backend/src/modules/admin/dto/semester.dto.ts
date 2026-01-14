import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsEnum, IsDateString, IsBoolean, IsOptional } from 'class-validator';
import { SemesterTerm } from '@prisma/client';

export class CreateSemesterDto {
    @ApiProperty()
    @IsString()
    nameAr!: string;

    @ApiProperty()
    @IsString()
    nameEn!: string;

    @ApiProperty()
    @IsInt()
    year!: number;

    @ApiProperty({ enum: SemesterTerm })
    @IsEnum(SemesterTerm)
    term!: SemesterTerm;

    @ApiProperty()
    @IsDateString()
    startDate!: string;

    @ApiProperty()
    @IsDateString()
    endDate!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateSemesterDto {
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
    year?: number;

    @ApiPropertyOptional({ enum: SemesterTerm })
    @IsOptional()
    @IsEnum(SemesterTerm)
    term?: SemesterTerm;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
