
import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();

    console.log('--- Searching for all students named containing "عبدالمهيمن" ---');
    const students = await prisma.student.findMany({
        where: { fullNameAr: { contains: 'عبدالمهيمن' } },
        include: {
            enrollments: {
                include: {
                    grade: true,
                    semester: true,
                    courseUnit: {
                        include: {
                            course: true
                        }
                    }
                }
            }
        }
    });

    console.log(`Found ${students.length} students.`);

    for (const student of students) {
        console.log(`\nStudent: ${student.fullNameAr} (ID: ${student.id})`);
        console.log(`Semester Level: ${student.semesterLevel}`);
        console.log(`Enrollments Count: ${student.enrollments.length}`);

        const published = student.enrollments.filter(e => e.grade?.isPublished);
        console.log(`Published Grades Count: ${published.length}`);

        if (published.length > 0) {
            console.log('First 3 published courses:');
            published.slice(0, 3).forEach(e => {
                console.log(` - ${e.courseUnit.course.code}: ${e.grade?.totalScore} (Level: ${e.courseUnit.course.semesterLevel})`);
            });
        }
    }

    console.log('\n--- Checking Global Level Statistics ---');
    const levelCounts = await prisma.student.groupBy({
        by: ['semesterLevel'],
        _count: true
    });
    console.log('Student counts by level:', levelCounts);

    await prisma.$disconnect();
}

main();
