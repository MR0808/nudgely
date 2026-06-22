import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { createDirectPrismaClient } from '@/lib/create-prisma-client';

import { resetDatabase } from './lib/reset-database';
import { seedAdminUser } from './lib/seed-admin';
import { seedReferenceData } from './lib/seed-reference-data';

const prisma = createDirectPrismaClient();

async function main() {
    console.log('🌱 Nudgely database seed');
    console.log('   This will DELETE all data and reload reference tables.\n');

    console.log('🗑️  Resetting database...');
    await resetDatabase(prisma);
    console.log('  ✓ all tables truncated\n');

    await seedReferenceData(prisma);
    console.log('');

    const admin = await seedAdminUser(prisma);

    const credentialsPath = join(
        process.cwd(),
        'prisma',
        'seed',
        '.last-seed-credentials.txt'
    );

    const credentials = [
        'Nudgely seed credentials (generated; do not commit)',
        '====================================================',
        `Email:    ${admin.email}`,
        `Password: ${admin.password}`,
        `User ID:  ${admin.userId}`,
        `Company:  ${admin.companyId} (Nudgely)`,
        `Team:     ${admin.teamId}`,
        '',
        'Login at /auth/login — user is SITE_ADMIN + COMPANY_ADMIN on Free plan.'
    ].join('\n');

    writeFileSync(credentialsPath, `${credentials}\n`, 'utf8');

    console.log('\n🎉 Seed completed successfully!\n');
    console.log(credentials);
    console.log(`\nCredentials saved to ${credentialsPath}`);
}

main()
    .catch((error) => {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
