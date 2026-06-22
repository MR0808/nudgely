import 'dotenv/config';

import { createAcceleratePrismaClient, type AcceleratePrismaClient } from '@/lib/create-prisma-client';

const globalForPrisma = globalThis as unknown as {
    prisma: AcceleratePrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createAcceleratePrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
