'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';

export async function getPlans(searchParams?: {
    [key: string]: string | string[] | undefined;
}) {
    // TODO: Replace with actual Prisma query
    const [plans, totalCount] = await Promise.all([
        prisma.plan.findMany({ orderBy: { level: 'asc' } }),
        prisma.plan.count()
    ]);

    return plans;

    // return [
    //   {
    //     id: "1",
    //     name: "Starter",
    //     slug: "starter",
    //     description: "Perfect for small teams getting started",
    //     priceMonthly: 49,
    //     priceYearly: 490,
    //     popular: false,
    //     features: [
    //       "Up to 10 users",
    //       "3 teams",
    //       "Basic templates",
    //       "Email support",
    //       "30-day nudge history",
    //     ],
    //     maxUsers: 10,
    //     maxTeams: 3,
    //     maxNudges: 50,
    //   },
    //   {
    //     id: "2",
    //     name: "Pro",
    //     slug: "pro",
    //     description: "For growing teams that need more power",
    //     priceMonthly: 199,
    //     priceYearly: 1990,
    //     popular: true,
    //     features: [
    //       "Up to 50 users",
    //       "Unlimited teams",
    //       "All templates + custom",
    //       "Priority support",
    //       "90-day nudge history",
    //       "Advanced analytics",
    //       "Data export",
    //     ],
    //     maxUsers: 50,
    //     maxTeams: 999,
    //     maxNudges: 500,
    //   },
    //   {
    //     id: "3",
    //     name: "Enterprise",
    //     slug: "enterprise",
    //     description: "For large organizations with advanced needs",
    //     priceMonthly: 499,
    //     priceYearly: 4990,
    //     popular: false,
    //     features: [
    //       "Unlimited users",
    //       "Unlimited teams",
    //       "All templates + custom",
    //       "24/7 priority support",
    //       "Unlimited nudge history",
    //       "Advanced analytics",
    //       "Data export",
    //       "Custom branding",
    //       "Dedicated account manager",
    //     ],
    //     maxUsers: 999999,
    //     maxTeams: 999999,
    //     maxNudges: 999999,
    //   },
    // ]
}

