import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();

    // Get the student being used for login (by registration number pattern)
    const students = await prisma.student.findMany({
        where: {
            fullNameAr: { contains: 'عبدالمهيمن' }
        },
        include: {
            identifiers: true,
            enrollments: {
                include: {
                    grade: true,
                    semester: true,
                    courseUnit: {
                        include: { course: true }
                    }
                }
            }
        }
    });

    console.log('=== ALL STUDENTS WITH THIS NAME ===');
    for (const s of students) {
        console.log(`\nID: ${s.id}`);
        console.log(`Name: ${s.fullNameAr}`);
        console.log(`Registration: ${s.identifiers.map(i => i.registrationNumberPrefix).join(', ')}`);
        console.log(`semesterLevel in DB: ${s.semesterLevel}`);
        console.log(`Enrollments: ${s.enrollments.length}`);
        const published = s.enrollments.filter(e => e.grade?.isPublished);
        console.log(`Published Grades: ${published.length}`);

        if (published.length > 0) {
            console.log('--- Course Levels ---');
            published.forEach(e => {
                console.log(`  ${e.courseUnit.course.code}: semesterLevel=${e.courseUnit.course.semesterLevel}`);
            });
        }
    }

    await prisma.$disconnect();
}

main();
