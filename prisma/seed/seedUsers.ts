import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function seed() {
    // Clear existing users
    //await prisma.user.deleteMany();
    const countries = await prisma.country.findMany({ select: { id: true } });

    // Generate 100 fake users
    const users = Array.from({ length: 100 }, () => ({
        name: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        emailVerified: faker.datatype.boolean(),
        passwordVerified: faker.datatype.boolean(),
        image: faker.image.avatar(),
        role: [faker.helpers.arrayElement(['MERCHANT', 'ADMIN'])],
        postalCode: faker.location.zipCode(),
        city: faker.location.city(),
        phoneNumber: faker.phone.number(),
        phoneVerified: faker.datatype.boolean(),
        countryId: countries[Math.floor(Math.random() * countries.length)].id,
        timezone: faker.helpers.arrayElement([
            'America/New_York',
            'Europe/London',
            'Asia/Tokyo',
            'Australia/Sydney'
        ]),
        locale: faker.helpers.arrayElement([
            'en-US',
            'en-GB',
            'fr-FR',
            'es-ES'
        ]),
        status: faker.helpers.arrayElement([
            'DRAFT',
            'PENDING',
            'APPROVED',
            'DISABLED',
            'REJECTED'
        ])
    }));

    // Insert users into the database
    await prisma.user.createMany({
        data: users
    });

    console.log('Seeded 100 users successfully');
}

async function main() {
    try {
        await seed();
    } catch (e) {
        console.error('Error seeding database:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
