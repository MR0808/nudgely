import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { createDirectPrismaClient } from '@/lib/create-prisma-client';

import {
    clearDemoData,
    DEMO_PASSWORD,
    seedDemoCompanies
} from './lib/seed-demo-data';
import { hashDemoPassword } from './lib/seed-helpers';

const prisma = createDirectPrismaClient();

async function main() {
    console.log('🌱 Nudgely demo seed');
    console.log('   Adds three sample companies (does not wipe reference data).\n');

    const planCount = await prisma.plan.count();
    if (planCount === 0) {
        throw new Error(
            'No plans found. Run `npm run db:seed` first to load reference data.'
        );
    }

    console.log('🗑️  Removing previous demo companies and users...');
    await clearDemoData(prisma);
    console.log('  ✓ cleared\n');

    const passwordHash = await hashDemoPassword(DEMO_PASSWORD);
    const result = await seedDemoCompanies(prisma, passwordHash);

    const lines = [
        'Nudgely demo seed credentials',
        '=============================',
        `Shared password for all demo users: ${DEMO_PASSWORD}`,
        '',
        ...result.companies.flatMap((company) => [
            `${company.name} (${company.plan})`,
            `  Slug:   ${company.slug}`,
            `  Admin:  ${company.adminEmail}`,
            `  Users:  ${company.users}`,
            `  Teams:  ${company.teams}`,
            ''
        ]),
        'All users: email verified, company profile complete, login at /auth/login'
    ];

    const credentialsPath = join(
        process.cwd(),
        'prisma',
        'seed',
        '.last-demo-credentials.txt'
    );

    writeFileSync(credentialsPath, `${lines.join('\n')}\n`, 'utf8');

    console.log('🎉 Demo seed completed!\n');
    console.log(lines.join('\n'));
    console.log(`\nCredentials saved to ${credentialsPath}`);
}

main()
    .catch((error) => {
        console.error('❌ Demo seed failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
