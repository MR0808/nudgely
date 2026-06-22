import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 CLI datasource URL.
 * Migrations, db push, and seed require a direct Postgres connection — not Accelerate.
 * @see https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7
 */
function getCliDatabaseUrl(): string {
    const directUrl = process.env.DIRECT_DATABASE_URL;
    const databaseUrl = process.env.DATABASE_URL;

    if (directUrl) {
        return directUrl;
    }

    const isAccelerate =
        databaseUrl?.startsWith('prisma://') ||
        databaseUrl?.startsWith('prisma+postgres://');

    if (isAccelerate) {
        throw new Error(
            'DIRECT_DATABASE_URL is required for Prisma CLI commands (migrate, db push, seed).\n' +
                'Add a direct postgresql:// connection string to .env — not the Accelerate URL.'
        );
    }

    if (!databaseUrl) {
        throw new Error('DATABASE_URL or DIRECT_DATABASE_URL must be set.');
    }

    return databaseUrl;
}

/** Optional shadow DB for migrate diff/dev. Use a direct Supabase URL (db.*.supabase.co), not the pooler. */
function getShadowDatabaseUrl(): string | undefined {
    return process.env.SHADOW_DATABASE_URL || undefined;
}

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
        seed: 'tsx prisma/seed/index.ts',
    },
    datasource: {
        url: getCliDatabaseUrl(),
        shadowDatabaseUrl: getShadowDatabaseUrl(),
    },
});
