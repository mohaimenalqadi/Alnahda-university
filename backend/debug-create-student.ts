import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // Get a department first
        const dept = await prisma.department.findFirst();
        if (!dept) {
            console.log('ERROR: No departments found. Please seed the database first.');
            return;
        }
        console.log('Using department:', dept.id, dept.nameAr);

        // Try to create a student
        const student = await prisma.student.create({
            data: {
                fullNameAr: 'اختبار التشخيص',
                fullNameEn: 'Debug Test Student',
                email: 'debug-test-' + Date.now() + '@example.com',
                registrationNumber: 'DEBUG-' + Date.now(),
                dateOfBirth: new Date('2000-01-01'),
                academicYear: 2024,
                semesterLevel: 1,
                departmentId: dept.id,
                identifiers: {
                    create: {
                        registrationNumberHash: 'debug-hash-' + Date.now(),
                        registrationNumberPrefix: 'DEBUG-***',
                    },
                },
            },
            include: { department: true },
        });

        console.log('\n✅ SUCCESS! Student created:');
        console.log('ID:', student.id);
        console.log('Name:', student.fullNameAr);
        console.log('Registration:', student.registrationNumber);

        // Clean up
        await prisma.studentIdentifier.deleteMany({ where: { studentId: student.id } });
        await prisma.student.delete({ where: { id: student.id } });
        console.log('\n🧹 Test student cleaned up.');
    } catch (error: unknown) {
        console.log('\n❌ ERROR occurred:');
        if (error instanceof Error) {
            console.log('Message:', error.message);
            console.log('Stack:', error.stack);
        }
        if (typeof error === 'object' && error !== null && 'code' in error) {
            console.log('Code:', (error as { code: string }).code);
        }
        if (typeof error === 'object' && error !== null && 'meta' in error) {
            console.log('Meta:', JSON.stringify((error as { meta: unknown }).meta, null, 2));
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
