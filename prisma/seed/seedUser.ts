import { PrismaClient } from '@prisma/client';
import { hash, verify, type Options } from '@node-rs/argon2';

const prisma = new PrismaClient();

const opts: Options = {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1
};

async function seedUser() {
    try {
        const data = await prisma.user.create({
            data: {
                name: 'Mark',
                lastName: 'Rosenberg',
                email: 'mark@docketrockit.com',
                role: ['ADMIN'],
                phoneNumber: '+61411896030',
                emailVerified: true,
                phoneVerified: true,
                passwordVerified: true
            }
        });
        const password = await hash('mark1234', opts);
        await prisma.account.create({
            data: {
                providerId: 'credential',
                password,
                userId: data.id,
                accountId: data.id,
                createdAt: new Date(Date.now()),
                updatedAt: new Date(Date.now())
            }
        });
        await prisma.businessUserAccess.create({
            data: {
                jobTitle: 'CIO',
                accessLevel: 'ADMIN',
                userId: data.id,
                permissions: ['MANAGE_USERS'],
                createdById: data.id
            }
        });
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        throw error;
    }
}

seedUser()
    .catch((error) => {
        console.error('💥 Seed failed:', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
