// import { PrismaClient } from '@prisma/client';
// const continents = [
//     'Asia',
//     'Europe',
//     'Africa',
//     'Oceania',
//     'North America',
//     'South America',
//     'Antarctica'
// ];
// const prisma = new PrismaClient();

// async function seedContinents() {
//     const totalLength = continents.length;
//     let count = 1;
//     try {
//         console.log('🌎 Seeding continents...');
//         for (const continent of continents) {
//             await prisma.continent.create({
//                 data: {
//                     name: continent
//                 }
//             });
//             console.log(`Seeded ${count} / ${totalLength} continents`);
//             count++;
//         }
//         console.log(`✅ Seeded ${continents.length} continents`);
//     } catch (error) {
//         console.error('❌ Error during seeding:', error);
//         throw error;
//     }
// }

// seedContinents()
//     .catch((error) => {
//         console.error('💥 Seed failed:', error);
//         process.exit(1);
//     })
//     .finally(() => prisma.$disconnect());
