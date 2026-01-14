
import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();

    console.log('--- Latest Student Login Attempts ---');
    const attempts = await prisma.loginAttempt.findMany({
        take: 10,
        orderBy: { attemptedAt: 'desc' },
        include: {
            student: {
                include: {
                    identifiers: true
                }
            }
        }
    });

    attempts.forEach(a => {
        console.log(`[${a.attemptedAt.toISOString()}] Success: ${a.success}, Ip: ${a.ipAddress}, Reason: ${a.failureReason}, Student: ${a.student?.fullNameAr || 'Unknown'}`);
    });

    console.log('\n--- Sample Students ---');
    const students = await prisma.student.findMany({
        take: 5,
        include: {
            identifiers: true
        }
    });

    students.forEach(s => {
        console.log(`ID: ${s.id}, Name: ${s.fullNameAr}, Reg: ${s.registrationNumber}, DOB: ${s.dateOfBirth.toISOString().split('T')[0]}, Prefix: ${s.identifiers[0]?.registrationNumberPrefix}`);
    });

    await prisma.$disconnect();
}

main();
