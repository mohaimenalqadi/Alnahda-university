// ===========================================
// Admin Login DTO
// ===========================================

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class AdminLoginDto {
    @ApiProperty({
        description: 'Admin email address',
        example: 'admin@alnahda-university.edu',
    })
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty({ message: 'Email is required' })
    email!: string;

    @ApiProperty({
        description: 'Admin password',
        example: 'Admin@123456',
    })
    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    password!: string;
}
