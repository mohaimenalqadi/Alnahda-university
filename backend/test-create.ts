
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    console.log('--- Diagnostic Student Creation ---');

    // 1. Fetch Department
    const dept = await prisma.department.findFirst();
    if (!dept) {
        console.log('❌ No departments found in database!');
        return;
    }
    console.log('Using Department:', { id: dept.id, nameAr: dept.nameAr, code: dept.code });

    const email = 'galaxs@gmail.com';
    const registrationNumber = '211243';

    // 2. Clean up existing
    const existing = await prisma.student.findFirst({ where: { OR: [{ email }, { registrationNumber }] } });
    if (existing) {
        console.log('Cleaning up existing student with same email/reg:', existing.id);
        await prisma.student.delete({ where: { id: existing.id } });
    }

    // 3. Attempt Creation
    try {
        const student = await prisma.student.create({
            data: {
                fullNameAr: 'عبدالمهيمن',
                fullNameEn: 'Abdulmuhaimin',
                email: email,
                registrationNumber: registrationNumber,
                dateOfBirth: new Date('2002-01-09'),
                academicYear: 2024,
                semesterLevel: 1,
                departmentId: dept.id,
                identifiers: {
                    create: {
                        registrationNumberHash: 'test-hash-' + Date.now(),
                        registrationNumberPrefix: '2112-***',
                    },
                },
            },
            include: { department: true }
        });
        console.log('✅ Success! Student created:', student.id);
    } catch (error: any) {
        console.error('❌ Creation Failed!');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        if (error.meta) console.error('Meta:', JSON.stringify(error.meta, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

run();
