import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminRoles() {
    console.log('--- Admin Users and Roles ---');
    const admins = await prisma.adminUser.findMany({
        include: {
            roles: {
                include: {
                    role: true
                }
            }
        }
    });

    for (const admin of admins) {
        console.log(`Admin: ${admin.email}`);
        console.log(`ID: ${admin.id}`);
        console.log(`Roles: ${admin.roles.map(r => r.role.name).join(', ') || 'NONE'}`);
        console.log('---------------------------');
    }

    console.log('\n--- All Available Roles ---');
    const roles = await prisma.role.findMany();
    for (const role of roles) {
        console.log(`Role: ${role.name} (${role.id})`);
    }
}

checkAdminRoles()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
