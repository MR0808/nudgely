import { randomBytes, randomUUID } from 'node:crypto';

import type { DirectPrismaClient } from '@/lib/create-prisma-client';
import { hashPassword } from '@/lib/argon2';

const ADMIN_EMAIL = 'mark@nudgelyapp.com';
const ADMIN_FIRST_NAME = 'Mark';
const ADMIN_LAST_NAME = 'Admin';
const COMPANY_NAME = 'Nudgely';
const COMPANY_SLUG = 'nudgely';

// Stable reference IDs from seed CSVs (Australia / Victoria / Technology / Small Business)
const AUSTRALIA_COUNTRY_ID = 'cmeum0xj1000cf54cm31jzj96';
const VICTORIA_REGION_ID = 'cmeum3vrt00brf5fopvvh0f32';
const TECHNOLOGY_INDUSTRY_ID = 'cmf3xlqut0000f5xcegsjnceo';
const SMALL_BUSINESS_SIZE_ID = 'cmf3xr9yy0001f5okcd2nbxcu';

export type AdminSeedResult = {
    email: string;
    password: string;
    userId: string;
    companyId: string;
    teamId: string;
};

export async function seedAdminUser(
    prisma: DirectPrismaClient
): Promise<AdminSeedResult> {
    console.log('👤 Seeding admin user and organisation...');

    const password = randomBytes(18).toString('base64url');
    const passwordHash = await hashPassword(password);
    const now = new Date();

    const freePlan = await prisma.plan.findUnique({
        where: { slug: 'free' }
    });

    if (!freePlan) {
        throw new Error('Free plan not found after reference seed');
    }

    const userId = randomUUID();
    const accountId = randomUUID();
    const companyId = randomUUID();
    const companyMemberId = randomUUID();
    const teamId = randomUUID();
    const teamMemberId = randomUUID();

    await prisma.user.create({
        data: {
            id: userId,
            name: ADMIN_FIRST_NAME,
            lastName: ADMIN_LAST_NAME,
            email: ADMIN_EMAIL,
            emailVerified: true,
            role: 'SITE_ADMIN',
            status: 'ACTIVE',
            phoneVerified: false,
            timezone: 'Australia/Melbourne',
            locale: 'en-AU',
            countryId: AUSTRALIA_COUNTRY_ID,
            regionId: VICTORIA_REGION_ID,
            jobTitle: 'Founder',
            createdAt: now,
            updatedAt: now
        }
    });

    await prisma.account.create({
        data: {
            id: accountId,
            accountId: userId,
            providerId: 'credential',
            password: passwordHash,
            userId,
            createdAt: now,
            updatedAt: now
        }
    });

    await prisma.company.create({
        data: {
            id: companyId,
            slug: COMPANY_SLUG,
            name: COMPANY_NAME,
            address1: '1 Example Street',
            city: 'Melbourne',
            regionId: VICTORIA_REGION_ID,
            postalCode: '3000',
            countryId: AUSTRALIA_COUNTRY_ID,
            contactEmail: ADMIN_EMAIL,
            contactPhone: '+61400000000',
            website: 'https://nudgelyapp.com',
            companySizeId: SMALL_BUSINESS_SIZE_ID,
            industryId: TECHNOLOGY_INDUSTRY_ID,
            timezone: 'Australia/Melbourne',
            locale: 'en-AU',
            profileCompleted: true,
            status: 'ACTIVE',
            planId: freePlan.id,
            creatorId: userId,
            createdAt: now,
            updatedAt: now
        }
    });

    await prisma.companyMember.create({
        data: {
            id: companyMemberId,
            companyId,
            userId,
            role: 'COMPANY_ADMIN',
            createdAt: now,
            updatedAt: now
        }
    });

    await prisma.team.create({
        data: {
            id: teamId,
            slug: COMPANY_SLUG,
            name: COMPANY_NAME,
            description: `The default team for ${COMPANY_NAME}`,
            companyId,
            creatorId: userId,
            defaultTeam: true,
            status: 'ACTIVE',
            isFrozen: false,
            createdAt: now,
            updatedAt: now
        }
    });

    await prisma.teamMember.create({
        data: {
            id: teamMemberId,
            teamId,
            userId,
            role: 'TEAM_ADMIN',
            status: 'ACTIVE',
            createdAt: now,
            updatedAt: now
        }
    });

    console.log('  ✓ admin user, company, and default team');

    return {
        email: ADMIN_EMAIL,
        password,
        userId,
        companyId,
        teamId
    };
}
