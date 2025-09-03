import { PrismaClient } from '@prisma/client';
import GithubSlugger from 'github-slugger';

const companySizes = [
    { name: 'Sole Proprietor', size: '1 employee' },
    { name: 'Small Business', size: '2-50 employees' },
    { name: 'Medium Business', size: '51-250 employees' },
    { name: 'Large Business', size: '251-1,000 employees' },
    { name: 'Enterprise', size: '1,001+ employees' }
];

const prisma = new PrismaClient();

const slugger = new GithubSlugger();

async function seedCompanySizes() {
    const totalLength = companySizes.length;
    let count = 1;
    try {
        console.log('Seeding industries...');
        for (const companySize of companySizes) {
            let slug = slugger.slug(companySize.name);
            await prisma.companySize.create({
                data: { slug, name: companySize.name, size: companySize.size }
            });
            console.log(`Seeded ${count} / ${totalLength} Company Sizes`);
            count++;
        }
        console.log(`✅ Seeded ${companySizes.length} Company Sizes`);
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        throw error;
    }
}

seedCompanySizes()
    .catch((error) => {
        console.error('💥 Seed failed:', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
