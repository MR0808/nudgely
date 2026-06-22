import { randomUUID } from 'node:crypto';

import type {
    CompanyRole,
    SiteRole,
    TeamRole
} from '@/generated/prisma/client';
import type { DirectPrismaClient } from '@/lib/create-prisma-client';
import { hashPassword } from '@/lib/argon2';

export const AUSTRALIA_COUNTRY_ID = 'cmeum0xj1000cf54cm31jzj96';
export const VICTORIA_REGION_ID = 'cmeum3vrt00brf5fopvvh0f32';
export const NSW_REGION_ID = 'cmeum3v9c00bhf5foad3oti0o';
export const TECHNOLOGY_INDUSTRY_ID = 'cmf3xlqut0000f5xcegsjnceo';
export const SMALL_BUSINESS_SIZE_ID = 'cmf3xr9yy0001f5okcd2nbxcu';
export const MEDIUM_BUSINESS_SIZE_ID = 'cmf3xra2p0002f5okhymjmhxv';
export const LARGE_BUSINESS_SIZE_ID = 'cmf3xra6l0003f5ok3bdejzrt';

export type DemoUserInput = {
    email: string;
    name: string;
    lastName: string;
    jobTitle?: string;
    siteRole?: SiteRole;
    timezone?: string;
    locale?: string;
};

export async function createCredentialUser(
    prisma: DirectPrismaClient,
    passwordHash: string,
    input: DemoUserInput,
    now = new Date()
) {
    const userId = randomUUID();
    const accountId = randomUUID();

    await prisma.user.create({
        data: {
            id: userId,
            name: input.name,
            lastName: input.lastName,
            email: input.email,
            emailVerified: true,
            role: input.siteRole ?? 'USER',
            status: 'ACTIVE',
            phoneVerified: false,
            jobTitle: input.jobTitle,
            timezone: input.timezone ?? 'Australia/Melbourne',
            locale: input.locale ?? 'en-AU',
            countryId: AUSTRALIA_COUNTRY_ID,
            regionId: VICTORIA_REGION_ID,
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

    return userId;
}

export async function createCompanyWithDefaultTeam(
    prisma: DirectPrismaClient,
    options: {
        slug: string;
        name: string;
        planId: string;
        creatorId: string;
        contactEmail: string;
        companySizeId?: string;
        industryId?: string;
        city?: string;
        regionId?: string;
        now?: Date;
    }
) {
    const now = options.now ?? new Date();
    const companyId = randomUUID();
    const companyMemberId = randomUUID();
    const teamId = randomUUID();
    const teamMemberId = randomUUID();

    await prisma.company.create({
        data: {
            id: companyId,
            slug: options.slug,
            name: options.name,
            address1: '100 Demo Street',
            city: options.city ?? 'Melbourne',
            regionId: options.regionId ?? VICTORIA_REGION_ID,
            postalCode: '3000',
            countryId: AUSTRALIA_COUNTRY_ID,
            contactEmail: options.contactEmail,
            contactPhone: '+61400000001',
            website: `https://${options.slug}.example.com`,
            companySizeId: options.companySizeId ?? SMALL_BUSINESS_SIZE_ID,
            industryId: options.industryId ?? TECHNOLOGY_INDUSTRY_ID,
            timezone: 'Australia/Melbourne',
            locale: 'en-AU',
            profileCompleted: true,
            status: 'ACTIVE',
            planId: options.planId,
            creatorId: options.creatorId,
            createdAt: now,
            updatedAt: now
        }
    });

    await prisma.companyMember.create({
        data: {
            id: companyMemberId,
            companyId,
            userId: options.creatorId,
            role: 'COMPANY_ADMIN',
            createdAt: now,
            updatedAt: now
        }
    });

    await prisma.team.create({
        data: {
            id: teamId,
            slug: options.slug,
            name: options.name,
            description: `Default team for ${options.name}`,
            companyId,
            creatorId: options.creatorId,
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
            userId: options.creatorId,
            role: 'TEAM_ADMIN',
            status: 'ACTIVE',
            createdAt: now,
            updatedAt: now
        }
    });

    return { companyId, teamId };
}

export async function addCompanyMember(
    prisma: DirectPrismaClient,
    companyId: string,
    userId: string,
    role: CompanyRole,
    now = new Date()
) {
    await prisma.companyMember.create({
        data: {
            id: randomUUID(),
            companyId,
            userId,
            role,
            createdAt: now,
            updatedAt: now
        }
    });
}

export async function createTeam(
    prisma: DirectPrismaClient,
    options: {
        slug: string;
        name: string;
        description: string;
        companyId: string;
        creatorId: string;
        now?: Date;
    }
) {
    const now = options.now ?? new Date();
    const teamId = randomUUID();

    await prisma.team.create({
        data: {
            id: teamId,
            slug: options.slug,
            name: options.name,
            description: options.description,
            companyId: options.companyId,
            creatorId: options.creatorId,
            defaultTeam: false,
            status: 'ACTIVE',
            isFrozen: false,
            createdAt: now,
            updatedAt: now
        }
    });

    return teamId;
}

export async function addTeamMember(
    prisma: DirectPrismaClient,
    teamId: string,
    userId: string,
    role: TeamRole,
    now = new Date()
) {
    await prisma.teamMember.create({
        data: {
            id: randomUUID(),
            teamId,
            userId,
            role,
            status: 'ACTIVE',
            createdAt: now,
            updatedAt: now
        }
    });
}

export async function hashDemoPassword(password: string) {
    return hashPassword(password);
}
