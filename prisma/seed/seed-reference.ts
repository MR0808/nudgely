import 'dotenv/config';

import { createDirectPrismaClient } from '@/lib/create-prisma-client';

import { seedReferenceData } from './lib/seed-reference-data';

const prisma = createDirectPrismaClient();

async function main() {
    console.log('🌱 Nudgely reference data seed (non-destructive)\n');

    const planCount = await prisma.plan.count();
    if (planCount > 0) {
        console.log(
            '  ✓ Reference data already present — nothing to do.\n' +
                '    Use `npm run db:seed` only if you intend to wipe and reload everything.'
        );
        return;
    }

    await seedReferenceData(prisma);
    console.log('\n🎉 Reference data seeded successfully.');
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
