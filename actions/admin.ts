'use server';

import { prisma } from '@/lib/prisma';
import { requireSiteAdmin } from '@/lib/require-site-admin';

function monthlyRevenueCents(
    priceMonthly: number,
    priceYearly: number,
    billingInterval: 'MONTHLY' | 'YEARLY'
) {
    return billingInterval === 'YEARLY'
        ? Math.round(priceYearly / 12)
        : priceMonthly;
}

export async function getDashboardStats() {
    await requireSiteAdmin();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
        totalUsers,
        activeUsers,
        usersLast30Days,
        totalCompanies,
        activeCompanies,
        companiesLast30Days,
        totalTeams,
        activeTeams,
        teamsLast30Days,
        activeNudges,
        pendingInstances,
        totalTemplates,
        activeTemplates,
        activeSubscriptions,
        subscriptionsLast30Days,
        paidCompanies,
        bannedUsers,
        bannedCompanies,
        pastDueSubscriptions,
        failedInstances
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.company.count(),
        prisma.company.count({ where: { status: 'ACTIVE' } }),
        prisma.company.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.team.count(),
        prisma.team.count({ where: { status: 'ACTIVE' } }),
        prisma.team.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.nudge.count({ where: { status: 'ACTIVE' } }),
        prisma.nudgeInstance.count({ where: { status: 'PENDING' } }),
        prisma.globalTemplate.count(),
        prisma.globalTemplate.count({ where: { isActive: true } }),
        prisma.companySubscription.count({
            where: { status: { in: ['active', 'trialing'] } }
        }),
        prisma.companySubscription.count({
            where: { createdAt: { gte: thirtyDaysAgo } }
        }),
        prisma.company.findMany({
            where: {
                companySubscription: {
                    status: { in: ['active', 'trialing'] }
                }
            },
            include: {
                plan: true,
                companySubscription: true
            }
        }),
        prisma.user.count({ where: { status: 'BANNED' } }),
        prisma.company.count({ where: { status: 'BANNED' } }),
        prisma.companySubscription.count({
            where: { status: { in: ['past_due', 'unpaid'] } }
        }),
        prisma.nudgeInstance.count({ where: { status: 'FAILED' } })
    ]);

    const userGrowth =
        totalUsers > 0
            ? Math.round((usersLast30Days / totalUsers) * 1000) / 10
            : 0;
    const companyGrowth =
        totalCompanies > 0
            ? Math.round((companiesLast30Days / totalCompanies) * 1000) / 10
            : 0;
    const teamGrowth =
        totalTeams > 0
            ? Math.round((teamsLast30Days / totalTeams) * 1000) / 10
            : 0;
    const subscriptionGrowth =
        activeSubscriptions > 0
            ? Math.round(
                  (subscriptionsLast30Days / activeSubscriptions) * 1000
              ) / 10
            : 0;

    const mrrCents = paidCompanies.reduce((sum, company) => {
        const sub = company.companySubscription;
        if (!sub) return sum;
        return (
            sum +
            monthlyRevenueCents(
                company.plan.priceMonthly,
                company.plan.priceYearly,
                sub.billingInterval
            )
        );
    }, 0);

    const systemAlerts: string[] = [];

    if (pendingInstances > 0) {
        systemAlerts.push(`${pendingInstances} pending nudge instances`);
    }
    if (failedInstances > 0) {
        systemAlerts.push(`${failedInstances} failed nudge instances`);
    }
    if (pastDueSubscriptions > 0) {
        systemAlerts.push(
            `${pastDueSubscriptions} subscription(s) past due or unpaid`
        );
    }
    if (bannedUsers > 0) {
        systemAlerts.push(`${bannedUsers} banned user(s)`);
    }
    if (bannedCompanies > 0) {
        systemAlerts.push(`${bannedCompanies} banned company/companies`);
    }

    return {
        totalUsers,
        activeUsers,
        userGrowth,
        totalCompanies,
        activeCompanies,
        companyGrowth,
        totalTeams,
        activeTeams,
        teamGrowth,
        activeSubscriptions,
        mrr: Math.round(mrrCents) / 100,
        subscriptionGrowth,
        activeNudges,
        pendingInstances,
        totalTemplates,
        activeTemplates,
        systemAlerts
    };
}
