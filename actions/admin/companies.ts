'use server';

import { prisma } from '@/lib/prisma';
import {
    cancelStripeSubscription,
    getStripePriceIdForPlan,
    isFreePlan,
    subscriptionSyncPayload,
    updateStripeSubscriptionPlan
} from '@/lib/stripe-admin';
import { checkDowngradedPlan } from '@/actions/subscriptions';
import { CompanyStatus } from '@/generated/prisma/client';
import type { Prisma } from '@/generated/prisma/client';

type CompanyWithRelations = Prisma.CompanyGetPayload<{
    include: {
        plan: true;
        companySubscription: true;
        industry: true;
        _count: { select: { members: true; teams: true } };
    };
}>;

export async function getCompanies(searchParams: {
    [key: string]: string | string[] | undefined;
}) {
    const page = parseInt((searchParams.page as string) || '1', 10);
    const pageSize = parseInt((searchParams.pageSize as string) || '20', 10);
    const search = searchParams.search as string | undefined;
    const status = searchParams.status as string | undefined;
    const plan = searchParams.plan as string | undefined;

    const where = {
        ...(search && {
            name: {
                contains: search,
                mode: 'insensitive' as const
            }
        }),
        ...(status && status !== 'all' && {
            status: status as CompanyStatus
        }),
        ...(plan && plan !== 'all' && {
            plan: {
                slug: plan
            }
        })
    };

    const companiesPromise = prisma.company.findMany({
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
    });

    const [companiesRaw, totalCount] = await Promise.all([
        companiesPromise,
        prisma.company.count({ where })
    ]);

    const companies = companiesRaw as CompanyWithRelations[];

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
    const freePlan = await prisma.plan.findFirst({
        where: { slug: 'free' }
    });

    if (!freePlan) {
        throw new Error('Free plan not found');
    }

    const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: { companySubscription: true }
    });

    if (!company) {
        throw new Error('Company not found');
    }

    if (company.companySubscription?.stripeSubscriptionId) {
        try {
            await cancelStripeSubscription(
                company.companySubscription.stripeSubscriptionId
            );
        } catch (error) {
            console.error(
                '[admin:grantFreePlan] Failed to cancel Stripe subscription:',
                error
            );
        }
    }

    await prisma.company.update({
        where: { id: companyId },
        data: {
            planId: freePlan.id,
            companySubscriptionId: null,
            trialEndsAt: null
        }
    });

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
    const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: { plan: true, companySubscription: true }
    });

    if (!company) {
        throw new Error('Company not found');
    }

    const targetPlan = await prisma.plan.findUnique({
        where: { id: planId }
    });

    if (!targetPlan) {
        throw new Error('Plan not found');
    }

    if (company.planId === planId) {
        return { success: true };
    }

    const isDowngrade = targetPlan.level < company.plan.level;

    if (isFreePlan(targetPlan)) {
        if (company.companySubscription?.stripeSubscriptionId) {
            await cancelStripeSubscription(
                company.companySubscription.stripeSubscriptionId
            );
        }

        await prisma.company.update({
            where: { id: companyId },
            data: {
                planId,
                companySubscriptionId: null
            }
        });

        await checkDowngradedPlan(companyId);
        return { success: true };
    }

    if (company.companySubscription?.stripeSubscriptionId) {
        const priceId = await getStripePriceIdForPlan(
            targetPlan,
            company.companySubscription.billingInterval
        );

        if (!priceId) {
            throw new Error('Target plan has no Stripe price for the current billing interval');
        }

        const updatedSubscription = await updateStripeSubscriptionPlan(
            company.companySubscription.stripeSubscriptionId,
            priceId,
            { companyId }
        );

        await prisma.companySubscription.update({
            where: { id: company.companySubscription.id },
            data: subscriptionSyncPayload(updatedSubscription)
        });
    }

    await prisma.company.update({
        where: { id: companyId },
        data: { planId }
    });

    if (isDowngrade) {
        await checkDowngradedPlan(companyId);
    }

    return { success: true };
}

