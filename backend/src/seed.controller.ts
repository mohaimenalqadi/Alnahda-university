import { Controller, Post, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import * as argon2 from 'argon2';

@Controller({ version: '1', path: 'seed' })
export class SeedController {
    constructor(private prisma: PrismaService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    async seed() {
        try {
            // Check if already seeded
            const existingDept = await this.prisma.department.findFirst();
            if (existingDept) {
                return {
                    success: false,
                    message: 'Database already seeded',
                };
            }

            // Create departments
            const departments = await Promise.all([
                this.prisma.department.create({
                    data: {
                        code: 'CS',
                        nameAr: 'علوم الحاسوب',
                        nameEn: 'Computer Science',
                        isActive: true,
                    },
                }),
                this.prisma.department.create({
                    data: {
                        code: 'IT',
                        nameAr: 'تقنية المعلومات',
                        nameEn: 'Information Technology',
                        isActive: true,
                    },
                }),
            ]);

            // Create semesters
            const semester = await this.prisma.semester.create({
                data: {
                    nameAr: 'الفصل الدراسي الخريفي 2024',
                    nameEn: 'Fall Semester 2024',
                    year: 2024,
                    term: 'FALL',
                    startDate: new Date('2024-09-01'),
                    endDate: new Date('2024-12-31'),
                    isActive: true,
                },
            });

            // Create admin role and admin user
            const adminRole = await this.prisma.role.create({
                data: {
                    name: 'ADMIN',
                    description: 'System Administrator',
                },
            });

            const adminPassword = await argon2.hash('Admin@123456');
            const adminUser = await this.prisma.adminUser.create({
                data: {
                    email: 'admin@alnahda-university.edu',
                    passwordHash: adminPassword,
                    fullName: 'مدير النظام',
                    mfaEnabled: false,
                    isActive: true,
                },
            });

            await this.prisma.adminUserRole.create({
                data: {
                    adminUserId: adminUser.id,
                    roleId: adminRole.id,
                },
            });

            // Create sample student
            const studentPassword = await argon2.hash('ALNAHDA_2024_001234');
            const student = await this.prisma.student.create({
                data: {
                    fullNameAr: 'أحمد محمد علي',
                    fullNameEn: 'Ahmed Mohammed Ali',
                    dateOfBirth: new Date('2000-01-15'),
                    email: 'ahmed.ali@student.alnahda.edu',
                    registrationNumber: '2024001234',
                    departmentId: departments[0].id,
                    academicYear: 2024,
                    semesterLevel: 1,
                    status: 'ACTIVE',
                },
            });

            await this.prisma.studentIdentifier.create({
                data: {
                    studentId: student.id,
                    registrationNumberHash: studentPassword,
                    registrationNumberPrefix: '2024-***',
                },
            });

            return {
                success: true,
                message: 'Database seeded successfully',
                credentials: {
                    admin: {
                        email: 'admin@alnahda-university.edu',
                        password: 'Admin@123456',
                    },
                    student: {
                        registrationNumber: '2024001234',
                        password: 'ALNAHDA_2024_001234',
                    },
                },
            };
        } catch (error) {
            return {
                success: false,
                message: 'Seed failed',
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
}
