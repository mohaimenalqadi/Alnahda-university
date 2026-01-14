// Test script to simulate what the API would return
import { PrismaClient } from '@prisma/client';

interface GradeResult {
    totalScore: number;
    passed: boolean;
    letterGrade: string;
    gradePoints: number;
    weightedPoints: number;
}

function getClassificationFromScore(score: number) {
    if (score >= 90) return { nameAr: 'ممتاز' };
    if (score >= 80) return { nameAr: 'جيد جداً' };
    if (score >= 70) return { nameAr: 'جيد' };
    if (score >= 60) return { nameAr: 'مقبول' };
    return { nameAr: 'راسب' };
}

async function main() {
    const prisma = new PrismaClient();
    const studentId = '6171fba5-e378-4a71-b345-ecfc9b872f6a'; // The student with data

    // Simulate getProfile
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
            department: true,
            identifiers: { select: { registrationNumberPrefix: true } },
        },
    });

    console.log('=== SIMULATED PROFILE RESPONSE ===');
    const profile = {
        id: student!.id,
        fullNameAr: student!.fullNameAr,
        fullNameEn: student!.fullNameEn,
        registrationNumber: student!.identifiers[0]?.registrationNumberPrefix || 'N/A',
        email: student!.email,
        academicYear: student!.academicYear,
        semesterLevel: student!.semesterLevel || 1,
        status: student!.status,
        department: {
            code: student!.department.code,
            nameAr: student!.department.nameAr,
            nameEn: student!.department.nameEn,
        },
    };
    console.log(JSON.stringify(profile, null, 2));

    // Simulate getAllResults
    const enrollments = await prisma.enrollment.findMany({
        where: { studentId },
        include: {
            semester: true,
            courseUnit: { include: { course: true } },
            grade: true,
        },
    });

    const semesterMap = new Map<string, any>();
    for (const enrollment of enrollments) {
        const { semester, courseUnit, grade } = enrollment;
        if (!grade || !grade.isPublished) continue;

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
            units: courseUnit.units,
            semesterLevel: courseUnit.course.semesterLevel,
            totalScore,
            passed: totalScore >= 50,
        });
    }

    // Calculate summaries
    const results = Array.from(semesterMap.values()).map(sem => {
        const totalUnits = sem.courses.reduce((acc: number, c: any) => acc + c.units, 0);
        const passedUnits = sem.courses.filter((c: any) => c.passed).reduce((acc: number, c: any) => acc + c.units, 0);
        const incompleteCourses = sem.courses.filter((c: any) => !c.passed).length;

        const levels = sem.courses.map((c: any) => c.semesterLevel).filter((l: any) => l > 0);
        const avgLevel = levels.length > 0 ? Math.max(...levels) : 1;

        const ordinalAr = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];
        const levelNameAr = avgLevel <= ordinalAr.length ? `الفصل الدراسي ${ordinalAr[avgLevel - 1]}` : `الفصل الدراسي ${avgLevel}`;

        // Simple GPA calculation
        const totalPoints = sem.courses.reduce((acc: number, c: any) => {
            const points = c.totalScore >= 90 ? 4.0 : c.totalScore >= 80 ? 3.0 : c.totalScore >= 70 ? 2.0 : c.totalScore >= 60 ? 1.0 : 0;
            return acc + points * c.units;
        }, 0);
        const gpa = totalUnits > 0 ? totalPoints / totalUnits : 0;

        return {
            ...sem,
            levelNameAr,
            currentLevel: avgLevel,
            summary: {
                totalUnits,
                completedUnits: passedUnits,
                passedUnits,
                incompleteCourses,
                gpa: Math.round(gpa * 10000) / 10000,
                classificationAr: gpa >= 3.5 ? 'ممتاز' : gpa >= 2.5 ? 'جيد جداً' : gpa >= 2.0 ? 'جيد' : 'مقبول',
                statusAr: incompleteCourses === 0 ? 'ناجح' : (incompleteCourses < 3 ? 'ناجح بمواد' : 'راسب'),
            },
        };
    });

    console.log('\n=== SIMULATED RESULTS RESPONSE ===');
    console.log(JSON.stringify(results, null, 2));

    await prisma.$disconnect();
}

main();
