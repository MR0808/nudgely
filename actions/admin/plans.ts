'use server';

import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logAdminAction } from '@/lib/admin-audit';
import { requireSiteAdmin } from '@/lib/require-site-admin';

type PlanRow = Prisma.PlanGetPayload<{
    include: { _count: { select: { companies: true } } };
}>;

export async function getPlans() {
    await requireSiteAdmin();

    const plansRaw = await prisma.plan.findMany({
        orderBy: { level: 'asc' },
        include: { _count: { select: { companies: true } } }
    });

    return plansRaw as unknown as PlanRow[];
}

export async function updatePlan(
    planId: string,
    data: Prisma.PlanUpdateInput
) {
    const session = await requireSiteAdmin();

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');

    await prisma.plan.update({
        where: { id: planId },
        data
    });

    await logAdminAction(
        session.user.id,
        'admin.plan_updated',
        `Updated plan ${plan.name}`,
        { planId, changes: data }
    );

    return { success: true };
}
