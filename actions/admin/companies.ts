'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';

export async function getCompanies(searchParams: {
    [key: string]: string | string[] | undefined;
}) {
    const page = parseInt((searchParams.page as string) || '1', 10);
    const pageSize = parseInt((searchParams.pageSize as string) || '20', 10);
    const search = searchParams.search as string | undefined;
    const status = searchParams.status as string | undefined;
    const plan = searchParams.plan as string | undefined;

    const where: Prisma.CompanyWhereInput = {};

    // Search filter - search by company name
    if (search) {
        where.name = {
            contains: search,
            mode: 'insensitive' as const
        };
    }

    // Status filter
    if (status && status !== 'all') {
        where.status = status as Prisma.EnumCompanyStatusFilter;
    }

    // Plan filter - filter by plan slug
    if (plan && plan !== 'all') {
        where.plan = {
            slug: plan
        };
    }

    const [companies, totalCount] = await Promise.all([
        prisma.company.findMany({
            where,
            include: {
                plan: true,
                companySubscription: true,
                industry: true,
                _count: {
                    select: {
                        members: true,
                        teams: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            ...(pageSize !== -1 && {
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        }),
        prisma.company.count({ where })
    ]);

    return { companies, totalCount };
}

export async function toggleCompanyStatus(companyId: string) {
    const company = await prisma.company.findUnique({
        where: { id: companyId }
    });
    if (!company) {
        throw new Error('Company not found');
    }

    await prisma.company.update({
        where: { id: companyId },
        data: {
            status: company.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
        }
    });

    return { success: true };
}

export async function banCompany(companyId: string, reason: string) {
    await prisma.company.update({
        where: { id: companyId },
        data: {
            status: 'BANNED'
            // TODO: Store ban reason in a separate table or audit log
        }
    });

    return { success: true };
}

export async function deleteCompany(companyId: string) {
    // Instead of actually deleting, we disable the company
    await prisma.company.update({
        where: { id: companyId },
        data: {
            status: 'DISABLED'
        }
    });

    return { success: true };
}

export async function grantFreePlan(companyId: string) {
    // Find the free plan
    const freePlan = await prisma.plan.findFirst({
        where: { slug: 'free' }
    });

    if (!freePlan) {
        throw new Error('Free plan not found');
    }

    // Update company to free plan and cancel subscription
    await prisma.company.update({
        where: { id: companyId },
        data: {
            planId: freePlan.id,
            companySubscriptionId: null,
            trialEndsAt: null
        }
    });

    // TODO: Cancel Stripe subscription if exists

    return { success: true };
}

export async function extendTrial(companyId: string, days: number) {
    const company = await prisma.company.findUnique({
        where: { id: companyId }
    });

    if (!company) {
        throw new Error('Company not found');
    }

    const currentTrialEnd = company.trialEndsAt || new Date();
    const newTrialEnd = new Date(currentTrialEnd);
    newTrialEnd.setDate(newTrialEnd.getDate() + days);

    await prisma.company.update({
        where: { id: companyId },
        data: {
            trialEndsAt: newTrialEnd
        }
    });

    return { success: true };
}

export async function changePlan(companyId: string, planId: string) {
    await prisma.company.update({
        where: { id: companyId },
        data: {
            planId
        }
    });

    // TODO: Update Stripe subscription if exists

    return { success: true };
}
