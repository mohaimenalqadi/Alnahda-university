import { Controller, Post, HttpCode, HttpStatus, SetMetadata } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import * as argon2 from 'argon2';

export const IS_PUBLIC_KEY = 'isPublic';
export const SkipCsrf = () => SetMetadata('skipCsrf', true);

@Controller({ version: '1', path: 'seed' })
export class SeedController {
    constructor(private prisma: PrismaService) { }

    @Post()
    @SkipCsrf()
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

            return await this.performSeed();
        } catch (error) {
            return {
                success: false,
                message: 'Seed failed',
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    @Post('force')
    @SkipCsrf()
    @HttpCode(HttpStatus.OK)
    async forceSeed() {
        try {
            // Clear existing data in correct order (children first)
            await this.prisma.auditLog.deleteMany();
            await this.prisma.gradeHistory.deleteMany();
            await this.prisma.grade.deleteMany();
            await this.prisma.enrollment.deleteMany();
            await this.prisma.studentIdentifier.deleteMany();
            await this.prisma.loginAttempt.deleteMany(); // Delete attempts before students
            await this.prisma.student.deleteMany();
            await this.prisma.courseUnit.deleteMany();
            await this.prisma.course.deleteMany();
            await this.prisma.semester.deleteMany();
            await this.prisma.refreshToken.deleteMany();
            await this.prisma.adminUserRole.deleteMany();
            await this.prisma.rolePermission.deleteMany();
            await this.prisma.adminUser.deleteMany();
            await this.prisma.permission.deleteMany();
            await this.prisma.role.deleteMany();
            await this.prisma.department.deleteMany();

            return await this.performSeed();
        } catch (error) {
            return {
                success: false,
                message: 'Force seed failed',
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    private async performSeed() {
        try {
            // Create standard permissions
            const permissionNames = [
                'view:dashboard',
                'manage:students',
                'manage:grades',
                'manage:courses',
                'manage:departments',
                'manage:settings',
                'view:audit_logs'
            ];

            const permissions = await Promise.all(
                permissionNames.map(name =>
                    this.prisma.permission.upsert({
                        where: { name },
                        update: {},
                        create: {
                            name,
                            action: name.split(':')[0],
                            resource: name.split(':')[1]
                        }
                    })
                )
            );

            // Create departments
            const departments = await Promise.all([
                this.prisma.department.upsert({
                    where: { code: 'CS' },
                    update: {},
                    create: {
                        code: 'CS',
                        nameAr: 'علوم الحاسوب',
                        nameEn: 'Computer Science',
                        isActive: true,
                    },
                }),
                this.prisma.department.upsert({
                    where: { code: 'IT' },
                    update: {},
                    create: {
                        code: 'IT',
                        nameAr: 'تقنية المعلومات',
                        nameEn: 'Information Technology',
                        isActive: true,
                    },
                }),
            ]);

            // Create semesters
            const semester = await this.prisma.semester.upsert({
                where: { year_term: { year: 2024, term: 'FALL' } },
                update: {},
                create: {
                    nameAr: 'الفصل الدراسي الخريفي 2024',
                    nameEn: 'Fall Semester 2024',
                    year: 2024,
                    term: 'FALL',
                    startDate: new Date('2024-09-01'),
                    endDate: new Date('2024-12-31'),
                    isActive: true,
                },
            });

            // Create roles
            const [adminRole, superAdminRole] = await Promise.all([
                this.prisma.role.upsert({
                    where: { name: 'ADMIN' },
                    update: {},
                    create: {
                        name: 'ADMIN',
                        description: 'System Administrator',
                    },
                }),
                this.prisma.role.upsert({
                    where: { name: 'SUPER_ADMIN' },
                    update: {},
                    create: {
                        name: 'SUPER_ADMIN',
                        description: 'Total Control Administrator',
                    },
                })
            ]);

            // Map ALL permissions to SUPER_ADMIN role
            await Promise.all(
                permissions.map(p =>
                    this.prisma.rolePermission.upsert({
                        where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: p.id } },
                        update: {},
                        create: { roleId: superAdminRole.id, permissionId: p.id }
                    })
                )
            );

            // Map partial permissions to ADMIN role (can be refined later)
            await Promise.all(
                permissions.filter(p => !p.name.includes('audit')).map(p =>
                    this.prisma.rolePermission.upsert({
                        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
                        update: {},
                        create: { roleId: adminRole.id, permissionId: p.id }
                    })
                )
            );

            const adminPassword = await argon2.hash('Admin@123456');
            const adminUser = await this.prisma.adminUser.upsert({
                where: { email: 'admin@alnahda-university.edu' },
                update: { passwordHash: adminPassword }, // Update password just in case
                create: {
                    email: 'admin@alnahda-university.edu',
                    passwordHash: adminPassword,
                    fullName: 'مدير النظام',
                    mfaEnabled: false,
                    isActive: true,
                },
            });

            // Grant BOTH roles to admin user
            await Promise.all([
                this.prisma.adminUserRole.upsert({
                    where: { adminUserId_roleId: { adminUserId: adminUser.id, roleId: adminRole.id } },
                    update: {},
                    create: { adminUserId: adminUser.id, roleId: adminRole.id },
                }),
                this.prisma.adminUserRole.upsert({
                    where: { adminUserId_roleId: { adminUserId: adminUser.id, roleId: superAdminRole.id } },
                    update: {},
                    create: { adminUserId: adminUser.id, roleId: superAdminRole.id },
                }),
            ]);

            // Create sample student
            const studentPassword = await argon2.hash('ALNAHDA_2024_001234');
            const student = await this.prisma.student.upsert({
                where: { registrationNumber: '2024001234' },
                update: {},
                create: {
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

            await this.prisma.studentIdentifier.upsert({
                where: { registrationNumberHash: studentPassword },
                update: {},
                create: {
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
        } catch (error: unknown) {
            return {
                success: false,
                message: 'Seed failed',
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
}

