'use server';

import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSiteAdmin } from '@/lib/require-site-admin';

type SubscriptionRow = Prisma.CompanySubscriptionGetPayload<{
    include: {
        company: {
            select: {
                id: true;
                name: true;
                slug: true;
                plan: { select: { name: true; slug: true } };
            };
        };
    };
}>;

export async function getSubscriptions(searchParams: {
    [key: string]: string | string[] | undefined;
}) {
    await requireSiteAdmin();

    const page = parseInt((searchParams.page as string) || '1', 10);
    const pageSize = parseInt((searchParams.pageSize as string) || '20', 10);
    const status = searchParams.status as string | undefined;
    const search = searchParams.search as string | undefined;

    const where = {
        ...(status && status !== 'all' && { status }),
        ...(search && {
            company: {
                name: { contains: search, mode: 'insensitive' as const }
            }
        })
    };

    const [subscriptionsRaw, totalCount] = await Promise.all([
        prisma.companySubscription.findMany({
            where,
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        plan: { select: { name: true, slug: true } }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            ...(pageSize !== -1 && {
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        }),
        prisma.companySubscription.count({ where })
    ]);

    const subscriptions = subscriptionsRaw as unknown as SubscriptionRow[];

    return { subscriptions, totalCount };
}
