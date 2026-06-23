'use server';

import { prisma } from '@/lib/prisma';
import { requireSiteAdmin } from '@/lib/require-site-admin';
import { logAdminAction } from '@/lib/admin-audit';
import { runSendNudgesJob } from '@/lib/cron/send-nudges-job';

export async function getCronStats() {
    await requireSiteAdmin();

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
        activeNudges,
        pendingInstances,
        failedInstances,
        eventsSentLast24h,
        lastAdminCronRun
    ] = await Promise.all([
        prisma.nudge.count({ where: { status: 'ACTIVE' } }),
        prisma.nudgeInstance.count({ where: { status: 'PENDING' } }),
        prisma.nudgeInstance.count({ where: { status: 'FAILED' } }),
        prisma.nudgeRecipientEvent.count({
            where: { sent: true, lastAttemptAt: { gte: oneDayAgo } }
        }),
        prisma.auditLog.findFirst({
            where: { action: 'admin.cron_triggered' },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true, description: true, metadata: true }
        })
    ]);

    return {
        activeNudges,
        pendingInstances,
        failedInstances,
        eventsSentLast24h,
        lastAdminCronRun
    };
}

export async function triggerSendNudgesCron() {
    const session = await requireSiteAdmin();

    const results = await runSendNudgesJob();

    await logAdminAction(
        session.user.id,
        'admin.cron_triggered',
        'Manually triggered send-nudges cron job',
        { results }
    );

    return { success: true, results };
}
