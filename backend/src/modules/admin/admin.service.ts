// ===========================================
// Admin Service
// Business logic for admin operations
// ===========================================

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { CacheService } from '@infrastructure/cache/cache.service';
import { CryptoService } from '@infrastructure/security/crypto.service';
import { GPACalculatorService } from '@domain/grade/services/gpa-calculator.service';
import { CreateGradeDto, UpdateGradeDto, PublishGradesDto } from './dto/grade.dto';
import { CreateStudentDto, UpdateStudentDto } from './dto/student.dto';
import { CreateSemesterDto, UpdateSemesterDto } from './dto/semester.dto';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { AuditAction } from '@prisma/client';

interface ListParams {
    page: number;
    limit: number;
    search?: string;
    departmentId?: string;
    status?: string;
}

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cacheService: CacheService,
        private readonly cryptoService: CryptoService,
        private readonly gpaCalculator: GPACalculatorService,
    ) { }

    // ===========================================
    // Dashboard
    // ===========================================

    async getDashboardStats() {
        const [
            totalStudents,
            activeStudents,
            totalCourses,
            totalEnrollments,
            pendingGrades,
            publishedGrades,
        ] = await Promise.all([
            this.prisma.student.count({ where: { deletedAt: null } }),
            this.prisma.student.count({ where: { status: 'ACTIVE', deletedAt: null } }),
            this.prisma.course.count(),
            this.prisma.enrollment.count(),
            this.prisma.grade.count({ where: { isPublished: false } }),
            this.prisma.grade.count({ where: { isPublished: true } }),
        ]);

        const activeSemester = await this.prisma.semester.findFirst({
            where: { isActive: true },
        });

        return {
            students: {
                total: totalStudents,
                active: activeStudents,
            },
            courses: totalCourses,
            enrollments: totalEnrollments,
            grades: {
                pending: pendingGrades,
                published: publishedGrades,
            },
            activeSemester: activeSemester ? {
                id: activeSemester.id,
                nameAr: activeSemester.nameAr,
                nameEn: activeSemester.nameEn,
            } : null,
        };
    }

    // ===========================================
    // Student Management
    // ===========================================

    async listStudents(params: ListParams) {
        const page = Number(params.page) || 1;
        const limit = Number(params.limit) || 20;
        const { search, departmentId, status } = params;
        const skip = (page - 1) * limit;

        const where: any = {
            deletedAt: null,
        };

        if (search) {
            where.OR = [
                { fullNameAr: { contains: search, mode: 'insensitive' } },
                { fullNameEn: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (departmentId) {
            where.departmentId = departmentId;
        }

        if (status) {
            where.status = status;
        }

        const [students, total] = await Promise.all([
            this.prisma.student.findMany({
                where,
                skip,
                take: limit,
                include: {
                    department: true,
                    identifiers: {
                        select: { registrationNumberPrefix: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.student.count({ where }),
        ]);

        return {
            data: students.map((s: any) => ({
                id: s.id,
                fullNameAr: s.fullNameAr,
                fullNameEn: s.fullNameEn,
                registrationNumber: s.registrationNumber || s.identifiers[0]?.registrationNumberPrefix || 'N/A',
                email: s.email,
                dateOfBirth: s.dateOfBirth,
                departmentId: s.departmentId,
                status: s.status,
                academicYear: s.academicYear,
                semesterLevel: s.semesterLevel,
                department: {
                    id: s.department.id,
                    code: s.department.code,
                    nameAr: s.department.nameAr,
                    nameEn: s.department.nameEn,
                },
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getStudentDetails(studentId: string) {
        const student = await this.prisma.student.findUnique({
            where: { id: studentId, deletedAt: null },
            include: {
                department: true,
                identifiers: true,
                enrollments: {
                    include: {
                        semester: true,
                        courseUnit: { include: { course: true } },
                        grade: true,
                    },
                },
            },
        });

        if (!student) {
            throw new NotFoundException('Student not found');
        }

        return student;
    }

    async createStudent(dto: CreateStudentDto, adminUserId: string) {
        try {
            this.logger.log(`Creating student with data: ${JSON.stringify(dto)}`);

            const registrationNumberHash = this.cryptoService.hashSHA256(dto.registrationNumber);

            const student = await this.prisma.student.create({
                data: {
                    fullNameAr: dto.fullNameAr,
                    fullNameEn: dto.fullNameEn,
                    email: dto.email || null,
                    registrationNumber: dto.registrationNumber,
                    dateOfBirth: new Date(dto.dateOfBirth),
                    academicYear: dto.academicYear,
                    semesterLevel: dto.semesterLevel || 1,
                    departmentId: dto.departmentId,
                    identifiers: {
                        create: {
                            registrationNumberHash,
                            registrationNumberPrefix: dto.registrationNumber, // Store full number instead of mask
                        },
                    },
                },
                include: { department: true },
            });

            this.logger.log(`Student created successfully: ${student.id}`);
            await this.createAuditLog(adminUserId, AuditAction.CREATE, 'student', student.id, null, dto);
            return student;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            const errorCode = (error as any)?.code;
            const errorMeta = (error as any)?.meta;

            this.logger.error(`Failed to create student: ${errorMessage}`, errorStack);
            this.logger.error(`Error code: ${errorCode}, Meta: ${JSON.stringify(errorMeta)}`);

            // Re-throw with more context
            throw error;
        }
    }

    async updateStudent(id: string, dto: UpdateStudentDto, adminUserId: string) {
        const existing = await this.prisma.student.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Student not found');

        const data: any = {
            ...dto,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        };

        // Update identifiers if registrationNumber changes
        if (dto.registrationNumber && dto.registrationNumber !== existing.registrationNumber) {
            const registrationNumberHash = this.cryptoService.hashSHA256(dto.registrationNumber);
            data.identifiers = {
                upsert: {
                    create: {
                        registrationNumberHash,
                        registrationNumberPrefix: dto.registrationNumber,
                    },
                    update: {
                        registrationNumberHash,
                        registrationNumberPrefix: dto.registrationNumber,
                    },
                },
            };
        }

        const updated = await this.prisma.student.update({
            where: { id },
            data,
            include: { identifiers: true },
        });

        await this.createAuditLog(adminUserId, AuditAction.UPDATE, 'student', id, existing, dto);
        return updated;
    }

    async deleteStudent(id: string, adminUserId: string) {
        await this.prisma.student.update({
            where: { id },
            data: { deletedAt: new Date(), status: 'INACTIVE' },
        });

        await this.createAuditLog(adminUserId, AuditAction.DELETE, 'student', id, { status: 'ACTIVE' }, { status: 'INACTIVE', deleted: true });
    }

    // ===========================================
    // Grade Management
    // ===========================================

    async listGrades(filters: {
        semesterId?: string;
        courseId?: string;
        departmentId?: string;
        semesterLevel?: number;
        isPublished?: boolean;
    }) {
        const where: any = {};

        if (filters.semesterId) {
            where.enrollment = { semesterId: filters.semesterId };
        }

        if (filters.departmentId || filters.semesterLevel) {
            where.enrollment = {
                ...where.enrollment,
                student: {
                    ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
                    ...(filters.semesterLevel ? { semesterLevel: Number(filters.semesterLevel) } : {}),
                }
            };
        }

        if (filters.courseId) {
            where.enrollment = {
                ...where.enrollment,
                courseUnit: { courseId: filters.courseId },
            };
        }

        if (filters.isPublished !== undefined) {
            where.isPublished = filters.isPublished;
        }

        const grades = await this.prisma.grade.findMany({
            where,
            include: {
                enrollment: {
                    include: {
                        student: true,
                        semester: true,
                        courseUnit: { include: { course: true } },
                    },
                },
                createdBy: { select: { fullName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return grades.map(g => ({
            id: g.id,
            student: {
                id: (g.enrollment.student as any).id,
                fullNameAr: (g.enrollment.student as any).fullNameAr,
                fullNameEn: (g.enrollment.student as any).fullNameEn,
                registrationNumber: (g.enrollment.student as any).registrationNumber || 'N/A',
            },
            course: {
                code: g.enrollment.courseUnit.course.code,
                nameAr: g.enrollment.courseUnit.course.nameAr,
                nameEn: g.enrollment.courseUnit.course.nameEn,
                units: g.enrollment.courseUnit.units,
            },
            semester: {
                nameAr: g.enrollment.semester.nameAr,
                nameEn: g.enrollment.semester.nameEn,
            },
            scores: {
                coursework: Number(g.courseworkScore),
                finalExam: Number(g.finalExamScore),
                total: Number(g.totalScore),
                letterGrade: g.letterGrade,
                gradePoints: Number(g.gradePoints),
            },
            isPublished: g.isPublished,
            publishedAt: g.publishedAt,
            createdBy: g.createdBy.fullName,
            createdAt: g.createdAt,
        }));
    }

    async createGrade(dto: CreateGradeDto, adminUserId: string) {
        try {
            let enrollmentId = dto.enrollmentId;

            // Auto-enrollment logic if enrollmentId is missing
            if (!enrollmentId) {
                if (!dto.studentId || !dto.courseId || !dto.semesterId) {
                    throw new BadRequestException('Either enrollmentId or (studentId, courseId, semesterId) must be provided');
                }

                // Find active course unit
                const courseUnit = await this.prisma.courseUnit.findFirst({
                    where: { courseId: dto.courseId, isActive: true },
                });

                if (!courseUnit) {
                    throw new NotFoundException(`Active course unit not found for course ID: ${dto.courseId}`);
                }

                // Upsert enrollment
                const enrollment = await this.prisma.enrollment.upsert({
                    where: {
                        studentId_courseUnitId_semesterId: {
                            studentId: dto.studentId,
                            courseUnitId: courseUnit.id,
                            semesterId: dto.semesterId,
                        },
                    },
                    update: {},
                    create: {
                        studentId: dto.studentId,
                        courseUnitId: courseUnit.id,
                        semesterId: dto.semesterId,
                    },
                });

                enrollmentId = enrollment.id;
            }

            // Verify enrollment exists
            const enrollment = await this.prisma.enrollment.findUnique({
                where: { id: enrollmentId },
                include: { courseUnit: true },
            });

            if (!enrollment) {
                throw new NotFoundException(`Enrollment not found for ID: ${enrollmentId}`);
            }

            // Calculate grade
            const gradeResult = this.gpaCalculator.calculateGrade({
                courseworkScore: Number(dto.courseworkScore),
                finalExamScore: Number(dto.finalExamScore),
                units: enrollment.courseUnit.units,
                maxCoursework: enrollment.courseUnit.maxCoursework,
                maxFinalExam: enrollment.courseUnit.maxFinalExam,
            });

            // Check if grade already exists for this enrollment
            const existingGrade = await this.prisma.grade.findUnique({
                where: { enrollmentId: enrollmentId },
            });

            let grade;
            if (existingGrade) {
                // UPDATE existing grade instead of failing
                grade = await this.prisma.grade.update({
                    where: { id: existingGrade.id },
                    data: {
                        courseworkScore: Number(dto.courseworkScore),
                        finalExamScore: Number(dto.finalExamScore),
                        totalScore: gradeResult.totalScore,
                        letterGrade: gradeResult.letterGrade,
                        gradePoints: gradeResult.gradePoints,
                        createdById: adminUserId, // Track who last updated it
                    },
                });

                // Log update audit
                await this.createAuditLog(
                    adminUserId,
                    AuditAction.UPDATE,
                    'grade',
                    grade.id,
                    { courseworkScore: Number(existingGrade.courseworkScore), finalExamScore: Number(existingGrade.finalExamScore) },
                    { enrollmentId: enrollmentId, ...gradeResult },
                );
            } else {
                // CREATE new grade
                grade = await this.prisma.grade.create({
                    data: {
                        enrollmentId: enrollmentId,
                        courseworkScore: Number(dto.courseworkScore),
                        finalExamScore: Number(dto.finalExamScore),
                        totalScore: gradeResult.totalScore,
                        letterGrade: gradeResult.letterGrade,
                        gradePoints: gradeResult.gradePoints,
                        isPublished: false,
                        createdById: adminUserId,
                    },
                });

                // Log create audit
                await this.createAuditLog(
                    adminUserId,
                    AuditAction.CREATE,
                    'grade',
                    grade.id,
                    null,
                    { enrollmentId: enrollmentId, ...gradeResult },
                );
            }

            // Clear student cache
            await this.cacheService.delPattern(`student:*`);

            // Return plain object to avoid Decimal serialization issues
            return {
                ...grade,
                courseworkScore: Number(grade.courseworkScore),
                finalExamScore: Number(grade.finalExamScore),
                totalScore: Number(grade.totalScore),
                gradePoints: Number(grade.gradePoints),
            };
        } catch (error: any) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Error in createGrade: ${error.message}`, error.stack);
            throw new BadRequestException(`فشل حفظ الدرجة: ${error.message}`);
        }
    }

    async updateGrade(gradeId: string, dto: UpdateGradeDto, adminUserId: string) {
        const existingGrade = await this.prisma.grade.findUnique({
            where: { id: gradeId },
            include: { enrollment: { include: { courseUnit: true } } },
        });

        if (!existingGrade) {
            throw new NotFoundException('Grade not found');
        }

        // Store old values for history
        const oldValues = {
            courseworkScore: Number(existingGrade.courseworkScore),
            finalExamScore: Number(existingGrade.finalExamScore),
            totalScore: Number(existingGrade.totalScore),
            letterGrade: existingGrade.letterGrade,
            gradePoints: Number(existingGrade.gradePoints),
        };

        // Calculate new grade
        const coursework = dto.courseworkScore ?? Number(existingGrade.courseworkScore);
        const finalExam = dto.finalExamScore ?? Number(existingGrade.finalExamScore);
        const courseUnit = existingGrade.enrollment.courseUnit;

        const gradeResult = this.gpaCalculator.calculateGrade({
            courseworkScore: coursework,
            finalExamScore: finalExam,
            units: courseUnit.units,
            maxCoursework: courseUnit.maxCoursework,
            maxFinalExam: courseUnit.maxFinalExam,
        });

        // Update grade in transaction with history
        const [updatedGrade] = await this.prisma.$transaction([
            this.prisma.grade.update({
                where: { id: gradeId },
                data: {
                    courseworkScore: coursework,
                    finalExamScore: finalExam,
                    totalScore: gradeResult.totalScore,
                    letterGrade: gradeResult.letterGrade,
                    gradePoints: gradeResult.gradePoints,
                },
            }),
            this.prisma.gradeHistory.create({
                data: {
                    gradeId,
                    courseworkScore: oldValues.courseworkScore,
                    finalExamScore: oldValues.finalExamScore,
                    totalScore: oldValues.totalScore,
                    letterGrade: oldValues.letterGrade,
                    gradePoints: oldValues.gradePoints,
                    changedById: adminUserId,
                    changeReason: dto.changeReason || 'Grade correction',
                },
            }),
        ]);

        // Log audit event
        await this.createAuditLog(
            adminUserId,
            AuditAction.UPDATE,
            'grade',
            gradeId,
            oldValues,
            { ...gradeResult, changeReason: dto.changeReason },
        );

        // Clear cache
        await this.cacheService.delPattern(`student:*`);

        return updatedGrade;
    }

    async publishGrades(dto: PublishGradesDto, adminUserId: string) {
        const where: any = {
            enrollment: { semesterId: dto.semesterId },
            isPublished: false,
        };

        if (dto.studentId) {
            where.enrollment.studentId = dto.studentId;
        }

        const count = await this.prisma.grade.updateMany({
            where,
            data: {
                isPublished: true,
                publishedAt: new Date(),
            },
        });

        // Log audit event
        await this.createAuditLog(
            adminUserId,
            AuditAction.UPDATE,
            'semester_grades',
            dto.semesterId,
            null,
            { action: 'publish', count: count.count },
        );

        // Clear all student caches
        await this.cacheService.delPattern(`student:*`);

        return {
            message: `Published ${count.count} grades for semester`,
            count: count.count,
        };
    }

    async deleteEnrollment(id: string, adminUserId: string) {
        // 1. Fetch existing enrollment to verify and for audit log
        const enrollment = await this.prisma.enrollment.findUnique({
            where: { id },
            include: {
                student: true,
                courseUnit: { include: { course: true } },
                semester: true,
                grade: true,
            },
        });

        if (!enrollment) {
            throw new NotFoundException('Enrollment not found');
        }

        // 2. Perform deletion in a transaction
        await this.prisma.$transaction(async (tx) => {
            if (enrollment.grade) {
                // Delete grade history
                await tx.gradeHistory.deleteMany({
                    where: { gradeId: enrollment.grade.id },
                });

                // Delete grade
                await tx.grade.delete({
                    where: { id: enrollment.grade.id },
                });
            }

            // Delete enrollment
            await tx.enrollment.delete({
                where: { id },
            });
        });

        // 3. Create audit log
        await this.createAuditLog(
            adminUserId,
            AuditAction.DELETE,
            'enrollment',
            id,
            {
                studentName: enrollment.student.fullNameAr,
                courseName: enrollment.courseUnit.course.nameAr,
                semesterName: enrollment.semester.nameAr,
                hasGrade: !!enrollment.grade,
            },
            { deleted: true }
        );

        // 4. Clear relevant student caches
        await this.cacheService.delPattern(`student:*`);
        await this.cacheService.delPattern(`grades:*`);
    }

    // ===========================================
    // Semester & Course Management
    // ===========================================

    async listSemesters() {
        return this.prisma.semester.findMany({
            orderBy: [{ year: 'desc' }, { term: 'desc' }],
        });
    }

    async createSemester(dto: CreateSemesterDto, adminUserId: string) {
        const semester = await this.prisma.semester.create({
            data: {
                ...dto,
                startDate: new Date(dto.startDate),
                endDate: new Date(dto.endDate),
            },
        });

        await this.createAuditLog(adminUserId, AuditAction.CREATE, 'semester', semester.id, null, dto);
        return semester;
    }

    async updateSemester(id: string, dto: UpdateSemesterDto, adminUserId: string) {
        const existing = await this.prisma.semester.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Semester not found');

        const updated = await this.prisma.semester.update({
            where: { id },
            data: {
                ...dto,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            },
        });

        await this.createAuditLog(adminUserId, AuditAction.UPDATE, 'semester', id, existing, dto);
        return updated;
    }

    async listCourses(departmentId?: string, semesterLevel?: number) {
        return this.prisma.course.findMany({
            where: {
                ...(departmentId ? { departmentId } : {}),
                ...(semesterLevel ? { semesterLevel: Number(semesterLevel) } : {}),
            } as any,
            include: {
                department: true,
                courseUnits: { where: { isActive: true } },
            },
            orderBy: [{ semesterLevel: 'asc' }, { code: 'asc' }] as any,
        });
    }

    async createCourse(dto: CreateCourseDto, adminUserId: string) {
        const course = await this.prisma.course.create({
            data: {
                code: dto.code,
                nameAr: dto.nameAr,
                nameEn: dto.nameEn,
                departmentId: dto.departmentId,
                semesterLevel: dto.semesterLevel,
                courseUnits: {
                    create: {
                        units: dto.units || 3,
                    }
                }
            } as any
        });

        await this.createAuditLog(adminUserId, AuditAction.CREATE, 'course', course.id, null, dto);
        return course;
    }

    async updateCourse(id: string, dto: UpdateCourseDto, adminUserId: string) {
        const existing = await this.prisma.course.findUnique({ where: { id }, include: { courseUnits: true } });
        if (!existing) throw new NotFoundException('Course not found');

        const updated = await this.prisma.course.update({
            where: { id },
            data: {
                code: dto.code,
                nameAr: dto.nameAr,
                nameEn: dto.nameEn,
                semesterLevel: dto.semesterLevel,
            } as any
        });

        if (dto.units !== undefined) {
            const activeUnit = existing.courseUnits.find(u => u.isActive);
            if (activeUnit) {
                await this.prisma.courseUnit.update({
                    where: { id: activeUnit.id },
                    data: { units: dto.units }
                });
            }
        }

        await this.createAuditLog(adminUserId, AuditAction.UPDATE, 'course', id, existing, dto);
        return updated;
    }

    async listDepartments() {
        return this.prisma.department.findMany({
            where: { isActive: true },
            include: {
                _count: {
                    select: { students: { where: { deletedAt: null } } }
                }
            },
            orderBy: { nameAr: 'asc' },
        });
    }

    async createDepartment(dto: CreateDepartmentDto, adminUserId: string) {
        const dept = await this.prisma.department.create({ data: dto });
        await this.createAuditLog(adminUserId, AuditAction.CREATE, 'department', dept.id, null, dto);
        return dept;
    }

    async updateDepartment(id: string, dto: UpdateDepartmentDto, adminUserId: string) {
        const existing = await this.prisma.department.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Department not found');

        const updated = await this.prisma.department.update({
            where: { id },
            data: dto,
        });

        await this.createAuditLog(adminUserId, AuditAction.UPDATE, 'department', id, existing, dto);
        return updated;
    }

    // ===========================================
    // Audit Logs
    // ===========================================

    async getAuditLogs(params: {
        page?: number;
        limit?: number;
        action?: string;
        adminUserId?: string;
        startDate?: string;
        endDate?: string;
    }) {
        const page = Number(params.page) || 1;
        const limit = Number(params.limit) || 20;
        const skip = (page - 1) * limit;

        const { action, adminUserId, startDate, endDate } = params;
        const where: any = {};

        if (action) {
            where.action = action as AuditAction;
        }

        if (adminUserId) {
            where.adminUserId = adminUserId;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                include: {
                    adminUser: { select: { fullName: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return {
            data: logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getStudentResults(studentId: string, semesterId?: string) {
        const where: any = { studentId };
        if (semesterId) {
            where.semesterId = semesterId;
        }

        const enrollments = await this.prisma.enrollment.findMany({
            where,
            include: {
                semester: true,
                courseUnit: { include: { course: true } },
                grade: true,
            },
            orderBy: { semester: { startDate: 'desc' } },
        });

        if (enrollments.length === 0) {
            return { results: [], summary: null };
        }

        // Group results by semester
        const resultsBySemester = new Map<string, any>();

        for (const enr of enrollments) {
            const semId = enr.semesterId;
            if (!resultsBySemester.has(semId)) {
                resultsBySemester.set(semId, {
                    semester: {
                        id: enr.semester.id,
                        nameAr: enr.semester.nameAr,
                        nameEn: enr.semester.nameEn,
                    },
                    courses: [], // Renamed from grades to match frontend
                });
            }

            const totalScore = enr.grade ? Number(enr.grade.totalScore) : 0;
            resultsBySemester.get(semId).courses.push({
                courseId: enr.courseUnit.course.id,
                courseCode: enr.courseUnit.course.code,
                courseNameAr: enr.courseUnit.course.nameAr,
                courseNameEn: enr.courseUnit.course.nameEn,
                units: enr.courseUnit.units,
                semesterLevel: enr.courseUnit.course.semesterLevel,
                courseworkScore: enr.grade ? Number(enr.grade.courseworkScore) : 0,
                finalExamScore: enr.grade ? Number(enr.grade.finalExamScore) : 0,
                totalScore,
                letterGrade: enr.grade ? enr.grade.letterGrade : '--',
                gradeId: enr.grade ? enr.grade.id : null,
                enrollmentId: enr.id,
                isPublished: enr.grade ? enr.grade.isPublished : false,
                letterGradeAr: enr.grade ? this.gpaCalculator.getClassificationFromScore(totalScore).nameAr : '--',
                passed: totalScore >= 50,
            });
        }

        const calculatedResults = Array.from(resultsBySemester.values()).map(sem => {
            const totalUnits = sem.courses.reduce((acc: number, g: any) => acc + g.units, 0);
            const passedUnits = sem.courses.filter((g: any) => g.passed).reduce((acc: number, g: any) => acc + g.units, 0);
            const failures = sem.courses.filter((g: any) => !g.passed && g.gradeId).length;
            const gradedCourses = sem.courses.filter((g: any) => g.gradeId);

            // Calculate GPA using the specialized calculator
            const gpaResult = this.gpaCalculator.calculateGPA(
                gradedCourses.map((g: any) => ({
                    totalScore: g.totalScore,
                    passed: g.passed,
                    letterGrade: g.letterGrade,
                    gradePoints: 0, // Not used in new formula but required by interface
                    weightedPoints: 0,
                })),
                gradedCourses.map((g: any) => g.units)
            );

            const avgScore = gradedCourses.length > 0
                ? this.gpaCalculator.roundToDecimal(gradedCourses.reduce((acc: number, g: any) => acc + g.totalScore, 0) / gradedCourses.length, 4)
                : 0;

            // Infer semester level name
            const levels = sem.courses.map((c: any) => c.semesterLevel).filter((l: any) => l > 0);
            const avgLevel = levels.length > 0 ? Math.max(...levels) : 1;
            const ordinalAr = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];
            const levelNameAr = avgLevel <= ordinalAr.length ? `الفصل الدراسي ${ordinalAr[avgLevel - 1]}` : `الفصل ${avgLevel}`;

            return {
                ...sem,
                semesterId: sem.semester.id,
                semesterNameAr: sem.semester.nameAr,
                semesterNameEn: sem.semester.nameEn,
                levelNameAr,
                summary: {
                    totalUnits,
                    completedUnits: passedUnits,
                    incompleteCourses: failures,
                    passedUnits,
                    failures,
                    averageScore: avgScore,
                    gpa: gpaResult.gpa,
                    statusAr: failures === 0 ? 'ناجح' : (failures < 3 ? 'ناجح بمواد' : 'راسب'),
                    classificationAr: gpaResult.classificationAr,
                },
            };
        });

        return calculatedResults;
    }

    // ===========================================
    // Helpers
    // ===========================================

    private async createAuditLog(
        adminUserId: string,
        action: AuditAction,
        resource: string,
        resourceId: string | null,
        oldValues: any,
        newValues: any,
    ) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    adminUserId,
                    action,
                    resource,
                    resourceId,
                    oldValues: this.serializeForLog(oldValues),
                    newValues: this.serializeForLog(newValues),
                    ipAddress: '0.0.0.0', // Should be passed from controller
                    correlationId: this.cryptoService.generateUUID(),
                },
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Failed to create audit log:', errorMessage);
        }
    }

    private serializeForLog(data: any): any {
        if (!data) return data;
        return JSON.parse(JSON.stringify(data, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
    }
}
