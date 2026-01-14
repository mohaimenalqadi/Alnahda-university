
import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    const student = await prisma.student.findFirst({
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

    if (!student) {
        console.log('Student not found');
        return;
    }

    console.log('Student Profile:', {
        id: student.id,
        fullNameAr: student.fullNameAr,
        semesterLevel: student.semesterLevel,
        status: student.status
    });

    console.log('Enrollments Count:', student.enrollments.length);
    const published = student.enrollments.filter(e => e.grade?.isPublished);
    console.log('Published Grades Count:', published.length);

    await prisma.$disconnect();
}

main();
