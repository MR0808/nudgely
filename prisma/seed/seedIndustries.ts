import { PrismaClient } from '@prisma/client';
import GithubSlugger from 'github-slugger';

const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Retail',
    'Manufacturing',
    'Professional Services',
    'Education',
    'Hospitality',
    'Construction',
    'Non-Profit / NGO',
    'Media / Entertainment',
    'Transportation / Logistics',
    'Government / Public Sector',
    'Energy / Utilities',
    'Other'
];

const prisma = new PrismaClient();

const slugger = new GithubSlugger();

async function seedIndustries() {
    const totalLength = industries.length;
    let count = 1;
    try {
        console.log('Seeding industries...');
        for (const industry of industries) {
            let slug = slugger.slug(industry);
            await prisma.industry.create({
                data: {
                    slug,
                    name: industry
                }
            });
            console.log(`Seeded ${count} / ${totalLength} industries`);
            count++;
        }
        console.log(`✅ Seeded ${industries.length} industries`);
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        throw error;
    }
}

seedIndustries()
    .catch((error) => {
        console.error('💥 Seed failed:', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
