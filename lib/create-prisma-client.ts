import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { withAccelerate } from '@prisma/extension-accelerate';
import { Pool } from 'pg';

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is not set`);
    }
    return value;
}

function isAccelerateUrl(url: string): boolean {
    return url.startsWith('prisma://') || url.startsWith('prisma+postgres://');
}

/** Runtime client — uses Prisma Accelerate (`DATABASE_URL`). */
export function createAcceleratePrismaClient() {
    const accelerateUrl = requireEnv('DATABASE_URL');

    if (!isAccelerateUrl(accelerateUrl)) {
        throw new Error(
            'DATABASE_URL must be a Prisma Accelerate URL (prisma:// or prisma+postgres://). ' +
                'For direct Postgres connections, use createDirectPrismaClient() instead.'
        );
    }

    return new PrismaClient({ accelerateUrl }).$extends(withAccelerate());
}

/** Direct Postgres client — for seeds, scripts, and non-Accelerate environments. */
export function createDirectPrismaClient(connectionString?: string) {
    const url =
        connectionString ??
        process.env.DIRECT_DATABASE_URL ??
        process.env.DATABASE_URL;

    if (!url) {
        throw new Error(
            'DIRECT_DATABASE_URL or DATABASE_URL must be set for a direct connection.'
        );
    }

    if (isAccelerateUrl(url)) {
        throw new Error(
            'Direct Prisma Client cannot use an Accelerate URL. Set DIRECT_DATABASE_URL to a postgresql:// connection string.'
        );
    }

    const pool = new Pool({ connectionString: url });
    return new PrismaClient({ adapter: new PrismaPg(pool) });
}

export type AcceleratePrismaClient = ReturnType<typeof createAcceleratePrismaClient>;
export type DirectPrismaClient = ReturnType<typeof createDirectPrismaClient>;
