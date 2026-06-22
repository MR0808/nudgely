import type { DirectPrismaClient } from '@/lib/create-prisma-client';

const TABLES = [
    'nudge_recipient_events',
    'nudge_completions',
    'nudge_recipients',
    'nudge_instances',
    'nudges',
    'team_invites',
    'team_members',
    'team_templates',
    'teams',
    'company_invites',
    'company_members',
    'companies',
    'pending_company_subscriptions',
    'company_subscriptions',
    'processed_stripe_events',
    'images',
    'audit_logs',
    'emailChangeRecords',
    'phoneChangeRecords',
    'rateLimits',
    'sessions',
    'accounts',
    'verifications',
    'users',
    'regions',
    'countries',
    'continents',
    'currencies',
    'global_templates',
    'plans',
    'industries',
    'companySizes'
] as const;

export async function resetDatabase(prisma: DirectPrismaClient) {
    const tableList = TABLES.map((table) => `"${table}"`).join(',\n      ');

    await prisma.$executeRawUnsafe(`
        TRUNCATE TABLE
            ${tableList}
        RESTART IDENTITY CASCADE;
    `);
}
