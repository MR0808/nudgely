import { PrismaClient } from '@prisma/client';
import { State } from 'country-state-city';

const prisma = new PrismaClient();

async function seedRegions() {
    try {
        let count = 0;
        const countries = await prisma.country.findMany();
        const countryCount = countries.length;
        for (const country of countries) {
            const states = State.getStatesOfCountry(country.isoCode);
            const statesCount = states.length;
            let stateCount = 0;
            count++;

            for (const state of states) {
                await prisma.region.create({
                    data: {
                        code: state.isoCode,
                        name: state.name,
                        countryId: country.id
                    }
                });
                stateCount++;
                console.log(
                    `State ${stateCount} / ${statesCount} - Country ${count} / ${countryCount}`
                );
            }
        }
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        throw error;
    }
}

seedRegions()
    .catch((error) => {
        console.error('💥 Seed failed:', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
