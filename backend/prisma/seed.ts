// ===========================================
// Database Seed Script
// Al-Nahda University - Sample Data
// ===========================================

import { PrismaClient, StudentStatus, SemesterTerm, AuditAction } from '@prisma/client';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Hash registration number for secure storage
function hashRegistrationNumber(regNumber: string): string {
    return crypto.createHash('sha256').update(regNumber).digest('hex');
}

// Get prefix for display (e.g., "2024-***")
function getRegistrationPrefix(regNumber: string): string {
    const parts = regNumber.split('-');
    if (parts.length >= 2) {
        return `${parts[0]}-***`;
    }
    return regNumber.substring(0, 4) + '***';
}

async function main() {
    console.log('🌱 Starting database seed...');

    // ===========================================
    // 1. Create Departments
    // ===========================================
    console.log('📚 Creating departments...');

    const departments = await Promise.all([
        prisma.department.upsert({
            where: { code: 'CS' },
            update: {},
            create: {
                code: 'CS',
                nameAr: 'علوم الحاسب الآلي',
                nameEn: 'Computer Science',
            },
        }),
        prisma.department.upsert({
            where: { code: 'ENG' },
            update: {},
            create: {
                code: 'ENG',
                nameAr: 'الهندسة',
                nameEn: 'Engineering',
            },
        }),
        prisma.department.upsert({
            where: { code: 'BUS' },
            update: {},
            create: {
                code: 'BUS',
                nameAr: 'إدارة الأعمال',
                nameEn: 'Business Administration',
            },
        }),
        prisma.department.upsert({
            where: { code: 'MED' },
            update: {},
            create: {
                code: 'MED',
                nameAr: 'الطب',
                nameEn: 'Medicine',
            },
        }),
    ]);

    console.log(`✅ Created ${departments.length} departments`);

    // ===========================================
    // 2. Create Semesters
    // ===========================================
    console.log('📅 Creating semesters...');

    const semesters = await Promise.all([
        prisma.semester.upsert({
            where: { year_term: { year: 2025, term: SemesterTerm.FALL } },
            update: {},
            create: {
                nameAr: 'الفصل الدراسي الأول 2025',
                nameEn: 'Fall Semester 2025',
                year: 2025,
                term: SemesterTerm.FALL,
                startDate: new Date('2025-09-01'),
                endDate: new Date('2025-12-31'),
                isActive: true,
            },
        }),
        prisma.semester.upsert({
            where: { year_term: { year: 2025, term: SemesterTerm.SPRING } },
            update: {},
            create: {
                nameAr: 'الفصل الدراسي الثاني 2025',
                nameEn: 'Spring Semester 2025',
                year: 2025,
                term: SemesterTerm.SPRING,
                startDate: new Date('2025-02-01'),
                endDate: new Date('2025-05-31'),
                isActive: false,
            },
        }),
        prisma.semester.upsert({
            where: { year_term: { year: 2024, term: SemesterTerm.FALL } },
            update: {},
            create: {
                nameAr: 'الفصل الدراسي الأول 2024',
                nameEn: 'Fall Semester 2024',
                year: 2024,
                term: SemesterTerm.FALL,
                startDate: new Date('2024-09-01'),
                endDate: new Date('2024-12-31'),
                isActive: false,
            },
        }),
    ]);

    console.log(`✅ Created ${semesters.length} semesters`);

    // ===========================================
    // 3. Create Courses
    // ===========================================
    console.log('📖 Creating courses...');

    const csDept = departments.find(d => d.code === 'CS')!;

    const courses = await Promise.all([
        prisma.course.upsert({
            where: { code: 'CS101' },
            update: {},
            create: {
                code: 'CS101',
                nameAr: 'مقدمة في علوم الحاسب',
                nameEn: 'Introduction to Computer Science',
                departmentId: csDept.id,
            },
        }),
        prisma.course.upsert({
            where: { code: 'CS201' },
            update: {},
            create: {
                code: 'CS201',
                nameAr: 'هياكل البيانات',
                nameEn: 'Data Structures',
                departmentId: csDept.id,
            },
        }),
        prisma.course.upsert({
            where: { code: 'CS301' },
            update: {},
            create: {
                code: 'CS301',
                nameAr: 'الخوارزميات',
                nameEn: 'Algorithms',
                departmentId: csDept.id,
            },
        }),
        prisma.course.upsert({
            where: { code: 'CS401' },
            update: {},
            create: {
                code: 'CS401',
                nameAr: 'قواعد البيانات',
                nameEn: 'Database Systems',
                departmentId: csDept.id,
            },
        }),
        prisma.course.upsert({
            where: { code: 'CS501' },
            update: {},
            create: {
                code: 'CS501',
                nameAr: 'هندسة البرمجيات',
                nameEn: 'Software Engineering',
                departmentId: csDept.id,
            },
        }),
    ]);

    console.log(`✅ Created ${courses.length} courses`);

    // ===========================================
    // 4. Create Course Units
    // ===========================================
    console.log('📊 Creating course units...');

    const courseUnits = await Promise.all(
        courses.map((course, index) =>
            prisma.courseUnit.create({
                data: {
                    courseId: course.id,
                    units: index < 2 ? 3 : 4, // First two courses are 3 units, rest are 4
                    maxCoursework: 40,
                    maxFinalExam: 60,
                    passingScore: 60,
                },
            })
        )
    );

    console.log(`✅ Created ${courseUnits.length} course units`);

    // ===========================================
    // 5. Create Admin Users & Roles
    // ===========================================
    console.log('👤 Creating admin users and roles...');

    // Create roles
    const superAdminRole = await prisma.role.upsert({
        where: { name: 'SUPER_ADMIN' },
        update: {},
        create: {
            name: 'SUPER_ADMIN',
            description: 'Full system access with all permissions',
        },
    });

    const adminRole = await prisma.role.upsert({
        where: { name: 'ADMIN' },
        update: {},
        create: {
            name: 'ADMIN',
            description: 'Standard admin access for grade management',
        },
    });

    const viewerRole = await prisma.role.upsert({
        where: { name: 'VIEWER' },
        update: {},
        create: {
            name: 'VIEWER',
            description: 'Read-only access to view records',
        },
    });

    // Create permissions
    const permissions = await Promise.all([
        // Student permissions
        prisma.permission.upsert({
            where: { resource_action: { resource: 'students', action: 'create' } },
            update: {},
            create: { name: 'students:create', resource: 'students', action: 'create' },
        }),
        prisma.permission.upsert({
            where: { resource_action: { resource: 'students', action: 'read' } },
            update: {},
            create: { name: 'students:read', resource: 'students', action: 'read' },
        }),
        prisma.permission.upsert({
            where: { resource_action: { resource: 'students', action: 'update' } },
            update: {},
            create: { name: 'students:update', resource: 'students', action: 'update' },
        }),
        prisma.permission.upsert({
            where: { resource_action: { resource: 'students', action: 'delete' } },
            update: {},
            create: { name: 'students:delete', resource: 'students', action: 'delete' },
        }),
        // Grade permissions
        prisma.permission.upsert({
            where: { resource_action: { resource: 'grades', action: 'create' } },
            update: {},
            create: { name: 'grades:create', resource: 'grades', action: 'create' },
        }),
        prisma.permission.upsert({
            where: { resource_action: { resource: 'grades', action: 'read' } },
            update: {},
            create: { name: 'grades:read', resource: 'grades', action: 'read' },
        }),
        prisma.permission.upsert({
            where: { resource_action: { resource: 'grades', action: 'update' } },
            update: {},
            create: { name: 'grades:update', resource: 'grades', action: 'update' },
        }),
        prisma.permission.upsert({
            where: { resource_action: { resource: 'grades', action: 'publish' } },
            update: {},
            create: { name: 'grades:publish', resource: 'grades', action: 'publish' },
        }),
        // Audit permissions
        prisma.permission.upsert({
            where: { resource_action: { resource: 'audit', action: 'read' } },
            update: {},
            create: { name: 'audit:read', resource: 'audit', action: 'read' },
        }),
        // Admin permissions
        prisma.permission.upsert({
            where: { resource_action: { resource: 'admins', action: 'manage' } },
            update: {},
            create: { name: 'admins:manage', resource: 'admins', action: 'manage' },
        }),
    ]);

    // Assign all permissions to SUPER_ADMIN
    for (const permission of permissions) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: permission.id } },
            update: {},
            create: { roleId: superAdminRole.id, permissionId: permission.id },
        });
    }

    // Assign limited permissions to ADMIN
    const adminPermissions = permissions.filter(p =>
        !p.name.includes('delete') && !p.name.includes('manage')
    );
    for (const permission of adminPermissions) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
            update: {},
            create: { roleId: adminRole.id, permissionId: permission.id },
        });
    }

    // Assign read permissions to VIEWER
    const viewerPermissions = permissions.filter(p => p.name.includes('read'));
    for (const permission of viewerPermissions) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: viewerRole.id, permissionId: permission.id } },
            update: {},
            create: { roleId: viewerRole.id, permissionId: permission.id },
        });
    }

    // Create admin user (password: Admin@123456)
    const adminPasswordHash = await argon2.hash('Admin@123456');
    const adminUser = await prisma.adminUser.upsert({
        where: { email: 'admin@alnahda-university.edu' },
        update: {},
        create: {
            email: 'admin@alnahda-university.edu',
            passwordHash: adminPasswordHash,
            fullName: 'System Administrator',
            mfaEnabled: false, // Set to true in production
        },
    });

    // Assign SUPER_ADMIN role
    await prisma.adminUserRole.upsert({
        where: { adminUserId_roleId: { adminUserId: adminUser.id, roleId: superAdminRole.id } },
        update: {},
        create: { adminUserId: adminUser.id, roleId: superAdminRole.id },
    });

    console.log('✅ Created admin users and roles');

    // ===========================================
    // 6. Create Sample Students
    // ===========================================
    console.log('🎓 Creating sample students...');

    const sampleStudents = [
        {
            fullNameAr: 'أحمد محمد علي',
            fullNameEn: 'Ahmed Mohamed Ali',
            dateOfBirth: new Date('2002-05-15'),
            registrationNumber: '2024-CS-001',
            email: 'ahmed.ali@students.alnahda.edu',
        },
        {
            fullNameAr: 'فاطمة عبدالله حسن',
            fullNameEn: 'Fatima Abdullah Hassan',
            dateOfBirth: new Date('2003-08-22'),
            registrationNumber: '2024-CS-002',
            email: 'fatima.hassan@students.alnahda.edu',
        },
        {
            fullNameAr: 'محمود أحمد سعيد',
            fullNameEn: 'Mahmoud Ahmed Saeed',
            dateOfBirth: new Date('2002-11-10'),
            registrationNumber: '2024-CS-003',
            email: 'mahmoud.saeed@students.alnahda.edu',
        },
    ];

    const students = [];
    for (const studentData of sampleStudents) {
        const student = await prisma.student.create({
            data: {
                fullNameAr: studentData.fullNameAr,
                fullNameEn: studentData.fullNameEn,
                dateOfBirth: studentData.dateOfBirth,
                email: studentData.email,
                departmentId: csDept.id,
                academicYear: 2,
                status: StudentStatus.ACTIVE,
                identifiers: {
                    create: {
                        registrationNumberHash: hashRegistrationNumber(studentData.registrationNumber),
                        registrationNumberPrefix: getRegistrationPrefix(studentData.registrationNumber),
                    },
                },
            },
        });
        students.push(student);
    }

    console.log(`✅ Created ${students.length} sample students`);

    // ===========================================
    // 7. Create Enrollments and Grades
    // ===========================================
    console.log('📝 Creating enrollments and grades...');

    const activeSemester = semesters.find(s => s.isActive)!;
    const gradeScale = [
        { min: 95, max: 100, letter: 'A+', points: 4.0 },
        { min: 90, max: 94, letter: 'A', points: 3.75 },
        { min: 85, max: 89, letter: 'B+', points: 3.5 },
        { min: 80, max: 84, letter: 'B', points: 3.0 },
        { min: 75, max: 79, letter: 'C+', points: 2.5 },
        { min: 70, max: 74, letter: 'C', points: 2.0 },
        { min: 65, max: 69, letter: 'D+', points: 1.5 },
        { min: 60, max: 64, letter: 'D', points: 1.0 },
        { min: 0, max: 59, letter: 'F', points: 0.0 },
    ];

    function getGradeInfo(totalScore: number) {
        for (const grade of gradeScale) {
            if (totalScore >= grade.min && totalScore <= grade.max) {
                return { letterGrade: grade.letter, gradePoints: grade.points };
            }
        }
        return { letterGrade: 'F', gradePoints: 0.0 };
    }

    // Sample grades for first student
    const sampleGrades = [
        { courseUnitIndex: 0, coursework: 35, final: 50 }, // 85 - B+
        { courseUnitIndex: 1, coursework: 38, final: 55 }, // 93 - A
        { courseUnitIndex: 2, coursework: 32, final: 45 }, // 77 - C+
        { courseUnitIndex: 3, coursework: 40, final: 58 }, // 98 - A+
        { courseUnitIndex: 4, coursework: 30, final: 50 }, // 80 - B
    ];

    for (const student of students) {
        for (const gradeData of sampleGrades) {
            const courseUnit = courseUnits[gradeData.courseUnitIndex];
            const totalScore = gradeData.coursework + gradeData.final;
            const gradeInfo = getGradeInfo(totalScore);

            const enrollment = await prisma.enrollment.create({
                data: {
                    studentId: student.id,
                    courseUnitId: courseUnit.id,
                    semesterId: activeSemester.id,
                },
            });

            await prisma.grade.create({
                data: {
                    enrollmentId: enrollment.id,
                    courseworkScore: gradeData.coursework,
                    finalExamScore: gradeData.final,
                    totalScore: totalScore,
                    letterGrade: gradeInfo.letterGrade,
                    gradePoints: gradeInfo.gradePoints,
                    isPublished: true,
                    publishedAt: new Date(),
                    createdById: adminUser.id,
                },
            });
        }
    }

    console.log('✅ Created enrollments and grades');

    // ===========================================
    // 8. Create Initial Audit Log
    // ===========================================
    console.log('📋 Creating initial audit log...');

    await prisma.auditLog.create({
        data: {
            adminUserId: adminUser.id,
            action: AuditAction.CREATE,
            resource: 'system',
            resourceId: null,
            oldValues: undefined,
            newValues: { event: 'Database seeded with initial data' },
            ipAddress: '127.0.0.1',
            userAgent: 'Prisma Seed Script',
            correlationId: crypto.randomUUID(),
        },
    });

    console.log('✅ Created initial audit log');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📌 Test Credentials:');
    console.log('   Admin Login:');
    console.log('     Email: admin@alnahda-university.edu');
    console.log('     Password: Admin@123456');
    console.log('\n   Student Login (Example):');
    console.log('     Registration Number: 2024-CS-001');
    console.log('     Date of Birth: 2002-05-15');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
