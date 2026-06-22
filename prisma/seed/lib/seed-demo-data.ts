import { randomUUID } from 'node:crypto';

import type { DirectPrismaClient } from '@/lib/create-prisma-client';

import {
    addCompanyMember,
    addTeamMember,
    createCompanyWithDefaultTeam,
    createCredentialUser,
    createTeam,
    LARGE_BUSINESS_SIZE_ID,
    MEDIUM_BUSINESS_SIZE_ID,
    NSW_REGION_ID,
    SMALL_BUSINESS_SIZE_ID
} from './seed-helpers';

const DEMO_COMPANY_SLUGS = [
    'demo-acme',
    'demo-bright-labs',
    'demo-growth-co'
] as const;

const DEMO_EMAILS = [
    'alice@demo-acme.test',
    'bob@demo-acme.test',
    'carol@demo-acme.test',
    'sarah@demo-bright.test',
    'david@demo-bright.test',
    'emma@demo-bright.test',
    'james@demo-bright.test',
    'lisa@demo-bright.test',
    'alex@demo-growth.test',
    'rachel@demo-growth.test',
    'tom@demo-growth.test',
    'nina@demo-growth.test',
    'oscar@demo-growth.test',
    'priya@demo-growth.test',
    'quinn@demo-growth.test',
    'ryan@demo-growth.test'
] as const;

export const DEMO_PASSWORD = 'NudgelyDemo2026!';

export async function clearDemoData(prisma: DirectPrismaClient) {
    await prisma.company.deleteMany({
        where: { slug: { in: [...DEMO_COMPANY_SLUGS] } }
    });

    await prisma.user.deleteMany({
        where: { email: { in: [...DEMO_EMAILS] } }
    });
}

export async function seedDemoCompanies(
    prisma: DirectPrismaClient,
    passwordHash: string
) {
    const now = new Date();

    const [freePlan, starterPlan, growthPlan] = await Promise.all([
        prisma.plan.findUnique({ where: { slug: 'free' } }),
        prisma.plan.findUnique({ where: { slug: 'starter' } }),
        prisma.plan.findUnique({ where: { slug: 'growth' } })
    ]);

    if (!freePlan || !starterPlan || !growthPlan) {
        throw new Error(
            'Plans not found. Run `npm run db:seed` first to load reference data.'
        );
    }

    // ── Company 1: Acme Solo (Free) ─────────────────────────────────────
    const aliceId = await createCredentialUser(prisma, passwordHash, {
        email: 'alice@demo-acme.test',
        name: 'Alice',
        lastName: 'Nguyen',
        jobTitle: 'Founder'
    }, now);

    const bobId = await createCredentialUser(prisma, passwordHash, {
        email: 'bob@demo-acme.test',
        name: 'Bob',
        lastName: 'Smith',
        jobTitle: 'Operations'
    }, now);

    const carolId = await createCredentialUser(prisma, passwordHash, {
        email: 'carol@demo-acme.test',
        name: 'Carol',
        lastName: 'Lee',
        jobTitle: 'Support'
    }, now);

    const acme = await createCompanyWithDefaultTeam(prisma, {
        slug: 'demo-acme',
        name: 'Acme Solo',
        planId: freePlan.id,
        creatorId: aliceId,
        contactEmail: 'alice@demo-acme.test',
        companySizeId: SMALL_BUSINESS_SIZE_ID,
        now
    });

    await addCompanyMember(prisma, acme.companyId, bobId, 'COMPANY_MEMBER', now);
    await addCompanyMember(prisma, acme.companyId, carolId, 'COMPANY_MEMBER', now);
    await addTeamMember(prisma, acme.teamId, bobId, 'TEAM_MEMBER', now);
    await addTeamMember(prisma, acme.teamId, carolId, 'TEAM_MEMBER', now);

    await prisma.nudge.create({
        data: {
            id: randomUUID(),
            slug: 'demo-acme-weekly-checkin',
            name: 'Weekly Check-in',
            description: 'Share priorities for the week',
            status: 'ACTIVE',
            frequency: 'WEEKLY',
            interval: 1,
            dayOfWeek: 1,
            timeOfDay: '09:00',
            timezone: 'Australia/Melbourne',
            endType: 'NEVER',
            teamId: acme.teamId,
            creatorId: aliceId,
            createdAt: now,
            updatedAt: now
        }
    });

    // ── Company 2: Bright Labs (Starter) ──────────────────────────────────
    const sarahId = await createCredentialUser(prisma, passwordHash, {
        email: 'sarah@demo-bright.test',
        name: 'Sarah',
        lastName: 'Johnson',
        jobTitle: 'CEO'
    }, now);

    const brightUserIds = await Promise.all(
        (
            [
                { email: 'david@demo-bright.test', name: 'David', lastName: 'Chen', jobTitle: 'Engineering Lead' },
                { email: 'emma@demo-bright.test', name: 'Emma', lastName: 'Wilson', jobTitle: 'Marketing Lead' },
                { email: 'james@demo-bright.test', name: 'James', lastName: 'Brown', jobTitle: 'Developer' },
                { email: 'lisa@demo-bright.test', name: 'Lisa', lastName: 'Martinez', jobTitle: 'Designer' }
            ] as const
        ).map((user) =>
            createCredentialUser(prisma, passwordHash, user, now)
        )
    );

    const [davidId, emmaId, jamesId, lisaId] = brightUserIds;

    const bright = await createCompanyWithDefaultTeam(prisma, {
        slug: 'demo-bright-labs',
        name: 'Bright Labs',
        planId: starterPlan.id,
        creatorId: sarahId,
        contactEmail: 'sarah@demo-bright.test',
        companySizeId: MEDIUM_BUSINESS_SIZE_ID,
        city: 'Sydney',
        regionId: NSW_REGION_ID,
        now
    });

    for (const userId of brightUserIds) {
        await addCompanyMember(prisma, bright.companyId, userId, 'COMPANY_MEMBER', now);
    }

    const brightEngTeamId = await createTeam(prisma, {
        slug: 'demo-bright-engineering',
        name: 'Engineering',
        description: 'Product development',
        companyId: bright.companyId,
        creatorId: sarahId,
        now
    });

    await addTeamMember(prisma, bright.teamId, emmaId, 'TEAM_ADMIN', now);
    await addTeamMember(prisma, brightEngTeamId, davidId, 'TEAM_ADMIN', now);
    await addTeamMember(prisma, brightEngTeamId, jamesId, 'TEAM_MEMBER', now);
    await addTeamMember(prisma, brightEngTeamId, lisaId, 'TEAM_MEMBER', now);

    await prisma.nudge.createMany({
        data: [
            {
                id: randomUUID(),
                slug: 'demo-bright-daily-standup',
                name: 'Daily Standup',
                description: 'Quick sync for engineering',
                status: 'ACTIVE',
                frequency: 'DAILY',
                interval: 1,
                timeOfDay: '09:30',
                timezone: 'Australia/Sydney',
                endType: 'NEVER',
                teamId: brightEngTeamId,
                creatorId: davidId,
                createdAt: now,
                updatedAt: now
            },
            {
                id: randomUUID(),
                slug: 'demo-bright-campaign-review',
                name: 'Campaign Review',
                description: 'Review marketing campaign metrics',
                status: 'ACTIVE',
                frequency: 'WEEKLY',
                interval: 1,
                dayOfWeek: 5,
                timeOfDay: '15:00',
                timezone: 'Australia/Sydney',
                endType: 'NEVER',
                teamId: bright.teamId,
                creatorId: emmaId,
                createdAt: now,
                updatedAt: now
            }
        ]
    });

    // ── Company 3: Growth Co (Growth) ───────────────────────────────────
    const alexId = await createCredentialUser(prisma, passwordHash, {
        email: 'alex@demo-growth.test',
        name: 'Alex',
        lastName: 'Kim',
        jobTitle: 'Managing Director'
    }, now);

    const growthUsers = await Promise.all(
        (
            [
                { email: 'rachel@demo-growth.test', name: 'Rachel', lastName: 'Taylor', jobTitle: 'HR Manager' },
                { email: 'tom@demo-growth.test', name: 'Tom', lastName: 'Anderson', jobTitle: 'Senior Engineer' },
                { email: 'nina@demo-growth.test', name: 'Nina', lastName: 'Patel', jobTitle: 'Sales Lead' },
                { email: 'oscar@demo-growth.test', name: 'Oscar', lastName: 'Garcia', jobTitle: 'Account Executive' },
                { email: 'priya@demo-growth.test', name: 'Priya', lastName: 'Sharma', jobTitle: 'CS Manager' },
                { email: 'quinn@demo-growth.test', name: 'Quinn', lastName: 'Murphy', jobTitle: 'Support Specialist' },
                { email: 'ryan@demo-growth.test', name: 'Ryan', lastName: 'OConnor', jobTitle: 'Product Manager' }
            ] as const
        ).map((user) =>
            createCredentialUser(prisma, passwordHash, user, now)
        )
    );

    const [rachelId, tomId, ninaId, oscarId, priyaId, quinnId, ryanId] =
        growthUsers;

    const growth = await createCompanyWithDefaultTeam(prisma, {
        slug: 'demo-growth-co',
        name: 'Growth Co',
        planId: growthPlan.id,
        creatorId: alexId,
        contactEmail: 'alex@demo-growth.test',
        companySizeId: LARGE_BUSINESS_SIZE_ID,
        now
    });

    for (const userId of growthUsers) {
        await addCompanyMember(prisma, growth.companyId, userId, 'COMPANY_MEMBER', now);
    }

    const growthEngId = await createTeam(prisma, {
        slug: 'demo-growth-engineering',
        name: 'Engineering',
        description: 'Platform and product engineering',
        companyId: growth.companyId,
        creatorId: alexId,
        now
    });

    const growthSalesId = await createTeam(prisma, {
        slug: 'demo-growth-sales',
        name: 'Sales',
        description: 'Revenue and partnerships',
        companyId: growth.companyId,
        creatorId: alexId,
        now
    });

    const growthMktId = await createTeam(prisma, {
        slug: 'demo-growth-marketing',
        name: 'Marketing',
        description: 'Brand and demand generation',
        companyId: growth.companyId,
        creatorId: alexId,
        now
    });

    const growthCsId = await createTeam(prisma, {
        slug: 'demo-growth-customer-success',
        name: 'Customer Success',
        description: 'Onboarding and retention',
        companyId: growth.companyId,
        creatorId: alexId,
        now
    });

    await addTeamMember(prisma, growth.teamId, ryanId, 'TEAM_MEMBER', now);
    await addTeamMember(prisma, growthEngId, tomId, 'TEAM_ADMIN', now);
    await addTeamMember(prisma, growthEngId, ryanId, 'TEAM_MEMBER', now);
    await addTeamMember(prisma, growthSalesId, ninaId, 'TEAM_ADMIN', now);
    await addTeamMember(prisma, growthSalesId, oscarId, 'TEAM_MEMBER', now);
    await addTeamMember(prisma, growthMktId, rachelId, 'TEAM_ADMIN', now);
    await addTeamMember(prisma, growthCsId, priyaId, 'TEAM_ADMIN', now);
    await addTeamMember(prisma, growthCsId, quinnId, 'TEAM_MEMBER', now);
    await addTeamMember(prisma, growthCsId, alexId, 'TEAM_MEMBER', now);

    const growthStandupId = randomUUID();
    const growthPipelineId = randomUUID();

    await prisma.nudge.createMany({
        data: [
            {
                id: growthStandupId,
                slug: 'demo-growth-standup',
                name: 'Engineering Standup',
                description: 'Daily engineering sync',
                status: 'ACTIVE',
                frequency: 'DAILY',
                interval: 1,
                timeOfDay: '09:00',
                timezone: 'Australia/Melbourne',
                endType: 'NEVER',
                teamId: growthEngId,
                creatorId: tomId,
                createdAt: now,
                updatedAt: now
            },
            {
                id: growthPipelineId,
                slug: 'demo-growth-pipeline-review',
                name: 'Pipeline Review',
                description: 'Weekly sales pipeline review',
                status: 'ACTIVE',
                frequency: 'WEEKLY',
                interval: 1,
                dayOfWeek: 3,
                timeOfDay: '10:00',
                timezone: 'Australia/Melbourne',
                endType: 'NEVER',
                teamId: growthSalesId,
                creatorId: ninaId,
                createdAt: now,
                updatedAt: now
            },
            {
                id: randomUUID(),
                slug: 'demo-growth-cs-feedback',
                name: 'Customer Feedback Roundup',
                description: 'Summarise customer feedback from the week',
                status: 'ACTIVE',
                frequency: 'WEEKLY',
                interval: 1,
                dayOfWeek: 1,
                timeOfDay: '11:00',
                timezone: 'Australia/Melbourne',
                endType: 'NEVER',
                teamId: growthCsId,
                creatorId: priyaId,
                createdAt: now,
                updatedAt: now
            }
        ]
    });

    await prisma.nudgeRecipient.createMany({
        data: [
            {
                id: randomUUID(),
                nudgeId: growthStandupId,
                userId: tomId,
                name: 'Tom Anderson',
                email: 'tom@demo-growth.test',
                createdAt: now,
                updatedAt: now
            },
            {
                id: randomUUID(),
                nudgeId: growthStandupId,
                userId: ryanId,
                name: 'Ryan OConnor',
                email: 'ryan@demo-growth.test',
                createdAt: now,
                updatedAt: now
            },
            {
                id: randomUUID(),
                nudgeId: growthPipelineId,
                userId: ninaId,
                name: 'Nina Patel',
                email: 'nina@demo-growth.test',
                createdAt: now,
                updatedAt: now
            },
            {
                id: randomUUID(),
                nudgeId: growthPipelineId,
                userId: oscarId,
                name: 'Oscar Garcia',
                email: 'oscar@demo-growth.test',
                createdAt: now,
                updatedAt: now
            }
        ]
    });

    return {
        companies: [
            {
                name: 'Acme Solo',
                slug: 'demo-acme',
                plan: 'Free',
                adminEmail: 'alice@demo-acme.test',
                users: 3,
                teams: 1
            },
            {
                name: 'Bright Labs',
                slug: 'demo-bright-labs',
                plan: 'Starter',
                adminEmail: 'sarah@demo-bright.test',
                users: 5,
                teams: 2
            },
            {
                name: 'Growth Co',
                slug: 'demo-growth-co',
                plan: 'Growth',
                adminEmail: 'alex@demo-growth.test',
                users: 8,
                teams: 5
            }
        ]
    };
}
