// ===========================================
// Student Service
// Business logic for student results
// ===========================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { CacheService } from '@infrastructure/cache/cache.service';
import { GPACalculatorService, GradeResult } from '@domain/grade/services/gpa-calculator.service';
import * as fs from 'fs';
import * as path from 'path';

export interface CourseResult {
    courseCode: string;
    courseNameAr: string;
    courseNameEn: string;
    units: number;
    courseworkScore: number;
    finalExamScore: number;
    totalScore: number;
    letterGrade: string;
    letterGradeAr: string;
    gradePoints: number;
    passed: boolean;
}

export interface SemesterResult {
    semesterId: string;
    semesterNameAr: string;
    semesterNameEn: string;
    year: number;
    term: string;
    courses: CourseResult[];
    levelNameAr?: string;
    summary?: {
        totalUnits: number;
        completedUnits: number;
        passedUnits: number;
        incompleteCourses: number;
        gpa: number;
        classificationAr: string;
        statusAr: string;
    };
}

@Injectable()
export class StudentService {
    private readonly logger = new Logger(StudentService.name);
    private readonly CACHE_TTL = 300; // 5 minutes

    constructor(
        private readonly prisma: PrismaService,
        private readonly cacheService: CacheService,
        private readonly gpaCalculator: GPACalculatorService,
    ) { }

    /**
     * Get student profile
     */
    async getProfile(studentId: string) {
        this.logger.debug(`Fetching profile for student: ${studentId}`);
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
            include: {
                department: true,
                identifiers: {
                    select: {
                        registrationNumberPrefix: true,
                    },
                },
            },
        });

        if (!student) {
            throw new NotFoundException('Student not found');
        }

        const profile = {
            id: student.id,
            fullNameAr: student.fullNameAr,
            fullNameEn: student.fullNameEn,
            registrationNumber: student.registrationNumber || 'N/A',
            email: student.email,
            academicYear: student.academicYear,
            semesterLevel: student.semesterLevel || 1,
            status: student.status,
            department: {
                code: student.department.code,
                nameAr: student.department.nameAr,
                nameEn: student.department.nameEn,
            },
        };

        // Trace for debugging
        try {
            const logPath = path.join(process.cwd(), 'student-profile-debug.log');
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] Profile: ${JSON.stringify(profile)}\n`);
        } catch (e) { }

        return profile;
    }

    /**
     * Get all results grouped by semester
     */
    async getAllResults(studentId: string): Promise<any[]> {
        this.logger.debug(`Fetching results for student: ${studentId}`);

        const enrollments = await this.prisma.enrollment.findMany({
            where: { studentId },
            include: {
                semester: true,
                courseUnit: {
                    include: {
                        course: true,
                    },
                },
                grade: true,
            },
            orderBy: [
                { semester: { startDate: 'desc' } },
            ],
        });

        // Group by semester
        const semesterMap = new Map<string, any>();

        for (const enrollment of enrollments) {
            const { semester, courseUnit, grade } = enrollment;

            // Only show published results to students
            if (!grade || !grade.isPublished) {
                continue;
            }

            const semesterId = semester.id;
            if (!semesterMap.has(semesterId)) {
                semesterMap.set(semesterId, {
                    semesterId,
                    semesterNameAr: semester.nameAr,
                    semesterNameEn: semester.nameEn,
                    year: semester.year,
                    term: semester.term,
                    courses: [],
                });
            }

            const semesterResult = semesterMap.get(semesterId)!;
            const totalScore = Number(grade.totalScore);

            semesterResult.courses.push({
                courseCode: courseUnit.course.code,
                courseNameAr: courseUnit.course.nameAr,
                courseNameEn: courseUnit.course.nameEn,
                units: courseUnit.units,
                semesterLevel: courseUnit.course.semesterLevel,
                courseworkScore: Number(grade.courseworkScore),
                finalExamScore: Number(grade.finalExamScore),
                totalScore,
                letterGrade: grade.letterGrade,
                letterGradeAr: this.gpaCalculator.getClassificationFromScore(totalScore).nameAr,
                gradePoints: Number(grade.gradePoints),
                passed: totalScore >= 50,
            });
        }

        // Calculate Summaries
        const finalResults = Array.from(semesterMap.values()).map(sem => {
            const totalUnits = sem.courses.reduce((acc: number, c: any) => acc + c.units, 0);
            const passedUnits = sem.courses.filter((c: any) => c.passed).reduce((acc: number, c: any) => acc + c.units, 0);
            const incompleteCourses = sem.courses.filter((c: any) => !c.passed).length;

            // GPA using specialized formula
            const gpaResult = this.gpaCalculator.calculateGPA(
                sem.courses.map((c: any) => ({
                    totalScore: c.totalScore,
                    passed: c.passed,
                    letterGrade: c.letterGrade,
                    gradePoints: 0,
                    weightedPoints: 0,
                })),
                sem.courses.map((c: any) => c.units)
            );

            // Infer semester level name
            const levels = sem.courses.map((c: any) => c.semesterLevel).filter((l: any) => l > 0);
            const avgLevel = levels.length > 0 ? Math.max(...levels) : 1;
            const ordinalAr = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];
            const levelNameAr = avgLevel <= ordinalAr.length ? `الفصل الدراسي ${ordinalAr[avgLevel - 1]}` : `الفصل الدراسي ${avgLevel}`;

            const passedCourses = sem.courses.filter((c: any) => c.passed).length;
            const summary = {
                totalUnits,
                completedUnits: passedUnits,
                passedUnits,
                incompleteCourses,
                gpa: gpaResult.gpa,
                classificationAr: gpaResult.classificationAr,
                statusAr: incompleteCourses === 0 ? 'ناجح' : (incompleteCourses < 3 && passedCourses > 0 ? 'ناجح بمواد' : 'راسب'),
            };

            return {
                ...sem,
                levelNameAr,
                currentLevel: avgLevel,
                summary,
                // Compatibility fields for old logic or charts
                semesterGPA: gpaResult.gpa,
                totalCredits: totalUnits,
            };
        });

        // Trace for debugging
        try {
            const logPath = path.join(process.cwd(), 'student-results-debug.log');
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] ID: ${studentId}, Count: ${finalResults.length}, FirstSummary: ${JSON.stringify(finalResults[0]?.summary)}\n`);
        } catch (e) { }

        return finalResults;
    }

    /**
     * Get results for a specific semester
     */
    async getSemesterResults(studentId: string, semesterId: string): Promise<SemesterResult> {
        const allResults = await this.getAllResults(studentId);
        const semesterResult = allResults.find(s => s.semesterId === semesterId);

        if (!semesterResult) {
            throw new NotFoundException('No results found for this semester');
        }

        return semesterResult;
    }

    /**
     * Get GPA summary
     */
    async getGPASummary(studentId: string) {
        const allResults = await this.getAllResults(studentId);

        const allGrades: GradeResult[] = [];
        const allUnits: number[] = [];
        let totalAttemptedUnits = 0;
        let failedCoursesCount = 0;

        for (const semester of allResults) {
            for (const course of semester.courses) {
                allGrades.push({
                    totalScore: course.totalScore,
                    letterGrade: course.letterGrade,
                    gradePoints: course.gradePoints,
                    weightedPoints: course.gradePoints * course.units,
                    passed: course.passed,
                });
                allUnits.push(course.units);
                totalAttemptedUnits += course.units;
                if (!course.passed) {
                    failedCoursesCount++;
                }
            }
        }

        const cumulativeGPA = this.gpaCalculator.calculateGPA(allGrades, allUnits);

        const semesterGPAs = allResults.map(s => ({
            semester: s.semesterNameAr,
            year: s.year,
            term: s.term,
            gpa: s.summary?.gpa || 0,
            credits: s.summary?.totalUnits || 0,
        }));

        // Custom Status Logic
        let classificationAr = cumulativeGPA.classificationAr;
        const passedCoursesCount = allGrades.filter(g => g.passed).length;

        if (allGrades.length > 0) {
            if (passedCoursesCount === 0 || failedCoursesCount >= 3) {
                classificationAr = 'راسب';
            } else if (failedCoursesCount > 0) {
                classificationAr = 'ناجح بمواد';
            }
        }

        return {
            cumulativeGPA: cumulativeGPA.gpa,
            totalCreditsEarned: totalAttemptedUnits, // User wants to see Total Registered/Attempted Units
            classification: cumulativeGPA.classification,
            classificationAr: classificationAr,
            semesterGPAs,
            gradingScale: this.gpaCalculator.getGradingScale(),
        };
    }

    /**
     * Get full academic transcript
     */
    async getTranscript(studentId: string) {
        const profile = await this.getProfile(studentId);
        const results = await this.getAllResults(studentId);
        const gpaSummary = await this.getGPASummary(studentId);

        return {
            student: profile,
            academicRecord: results,
            summary: {
                cumulativeGPA: gpaSummary.cumulativeGPA,
                totalCredits: gpaSummary.totalCreditsEarned,
                classification: gpaSummary.classification,
                classificationAr: gpaSummary.classificationAr,
            },
            generatedAt: new Date().toISOString(),
        };
    }
}
