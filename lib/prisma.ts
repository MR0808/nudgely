// import { PrismaClient } from '@/generated/prisma';
// import { withAccelerate } from '@prisma/extension-accelerate';

// // Use `any` on the global cache to avoid type-narrowing conflicts with the extended client
// const globalForPrisma = globalThis as unknown as {
//     prisma: ReturnType<typeof createPrismaClient> | undefined;
// };

// function createPrismaClient() {
//     const client = new PrismaClient({
//         datasourceUrl: process.env.DATABASE_URL // prisma://accelerate... URL
//     }).$extends(withAccelerate());

//     return client;
// }

// export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;


import 'dotenv/config';
// import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate'

const connectionString = `${process.env.DATABASE_URL}`;

// const adapter = new PrismaPg({ connectionString });
// const prisma = new PrismaClient({ adapter });

const prisma = new PrismaClient({
  accelerateUrl: connectionString,
}).$extends(withAccelerate())

export { prisma };
