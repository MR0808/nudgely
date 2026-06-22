import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { createDirectPrismaClient } from '../lib/create-prisma-client';

const prisma = createDirectPrismaClient();

async function main() {
    const templates = await prisma.globalTemplate.findMany({
        orderBy: { name: 'asc' }
    });
    writeFileSync(
        'prisma/seed/data/global_templates.json',
        JSON.stringify(templates, null, 2)
    );
    console.log(`Exported ${templates.length} global templates`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
