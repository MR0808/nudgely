'use server';
import 'server-only';

import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';

/* -------------------------------------------------------------
 * Raw SQL result types (NOT exported to prevent client imports)
 * ------------------------------------------------------------- */

type CompletionsOverTimeRow = { date: Date; count: number };

type TeamPerformanceRow = {
    teamId: string;
    teamName: string;
    completionRate: number;
};

type TopNudgeRow = {
    nudgeId: string;
    nudgeName: string;
    completions: number;
    instances: number;
    completionRate: number;
};

type ActiveRecipientRow = {
    email: string;
    name: string;
    completions: number;
    totalSent: number;
    completionRate: number;
};

type AttentionRow = {
    nudgeId: string;
    nudgeName: string;
    status: string;
    completionRate: number;
    overdueCount: number;
    lastInstanceDate: Date | null;
};

/* -------------------------------------------------------------
 * MAIN SERVER ACTION — fully Accelerate compatible
 * ------------------------------------------------------------- */

export async function getDashboardStats(teamId?: string) {
    const session = await authCheckServer();
    if (!session) {
        throw new Error('Not authorised');
    }

    const companyId = session.company.id;

    // Validate team belongs to the current company (and exists) if provided
    if (teamId) {
        const team = await prisma.team.findFirst({
            where: { id: teamId, companyId }
        });
        if (!team) {
            throw new Error('Invalid team for this company');
        }
    }

    const teamFilter = teamId ? { teamId } : { team: { companyId } };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    /* ---------------------------------------------------------
     * PARALLEL COUNTS — fast + works great with Accelerate
     * --------------------------------------------------------- */
    const [
        totalNudges,
        totalCompletions,
        totalInstances,
        pendingInstances,
        failedInstances,
        totalRecipients,
        completionsWithComments
    ] = await Promise.all([
        prisma.nudge.count({
            where: { ...teamFilter, status: 'ACTIVE' }
        }),

        prisma.nudgeCompletion.count({
            where: { nudge: teamFilter }
        }),

        prisma.nudgeInstance.count({
            where: { nudge: teamFilter }
        }),

        prisma.nudgeInstance.count({
            where: {
                nudge: teamFilter,
                status: 'PENDING'
            }
        }),

        prisma.nudgeInstance.count({
            where: {
                nudge: teamFilter,
                status: 'FAILED'
            }
        }),

        prisma.nudgeRecipient.count({
            where: { nudge: teamFilter }
        }),

        prisma.nudgeCompletion.count({
            where: {
                nudge: teamFilter,
                comments: { not: null }
            }
        })
    ]);

    const completionRate =
        totalInstances > 0 ? (totalCompletions / totalInstances) * 100 : 0;

    /* ---------------------------------------------------------
     * COMPLETIONS OVER TIME — Accelerate-safe SQL
     * --------------------------------------------------------- */
    const completionsOverTime = await prisma.$queryRaw<
        CompletionsOverTimeRow[]
    >(
        Prisma.sql`
            SELECT 
                DATE(nc."createdAt") AS date,
                COUNT(*)::int AS count
            FROM "nudge_completions" nc
            JOIN "nudge_instances" ni ON nc."nudgeInstanceId" = ni.id
            JOIN "nudges" n ON ni."nudgeId" = n.id
            JOIN "teams" t ON n."teamId" = t.id
            WHERE nc."createdAt" >= ${thirtyDaysAgo}
            AND t."companyId" = ${companyId}
            ${teamId ? Prisma.sql`AND t.id = ${teamId}` : Prisma.empty}
            GROUP BY DATE(nc."createdAt")
            ORDER BY date ASC
        `
    );

    /* ---------------------------------------------------------
     * GROUP BY: Frequency — FULLY TYPED (no {})
     * --------------------------------------------------------- */
    const nudgesByFrequencyRaw = (await prisma.nudge.groupBy({
        by: ['frequency'],
        where: { ...teamFilter, status: 'ACTIVE' },
        _count: { _all: true }
    })) as Array<{
        frequency: string;
        _count: { _all: number };
    }>;

    /* ---------------------------------------------------------
     * GROUP BY: Status — FULLY TYPED (no {})
     * --------------------------------------------------------- */
    const nudgesByStatusRaw = (await prisma.nudge.groupBy({
        by: ['status'],
        where: teamFilter,
        _count: { _all: true }
    })) as Array<{
        status: string;
        _count: { _all: number };
    }>;

    /* ---------------------------------------------------------
     * TEAM PERFORMANCE — Accelerate safe
     * --------------------------------------------------------- */
    const teamPerformance = await prisma.$queryRaw<TeamPerformanceRow[]>(
        Prisma.sql`
            SELECT 
                t.id AS "teamId",
                t.name AS "teamName",
                COALESCE(
                    (COUNT(DISTINCT nc.id)::float 
                        / NULLIF(COUNT(DISTINCT ni.id)::float, 0)) * 100,
                    0
                ) AS "completionRate"
            FROM "teams" t
            LEFT JOIN "nudges" n ON t.id = n."teamId"
            LEFT JOIN "nudge_instances" ni ON n.id = ni."nudgeId"
            LEFT JOIN "nudge_completions" nc ON ni.id = nc."nudgeInstanceId"
            WHERE t.status = 'ACTIVE'
            AND t."companyId" = ${companyId}
            ${teamId ? Prisma.sql`AND t.id = ${teamId}` : Prisma.empty}
            GROUP BY t.id, t.name
            ORDER BY "completionRate" DESC
            LIMIT 10
        `
    );

    /* ---------------------------------------------------------
     * TOP NUDGES
     * --------------------------------------------------------- */
    const topNudges = await prisma.$queryRaw<TopNudgeRow[]>(
        Prisma.sql`
            SELECT 
                n.id AS "nudgeId",
                n.name AS "nudgeName",
                COUNT(DISTINCT nc.id)::int AS completions,
                COUNT(DISTINCT ni.id)::int AS instances,
                COALESCE(
                    (COUNT(DISTINCT nc.id)::float 
                        / NULLIF(COUNT(DISTINCT ni.id)::float, 0)) * 100,
                    0
                ) AS "completionRate"
            FROM "nudges" n
            LEFT JOIN "nudge_instances" ni ON n.id = ni."nudgeId"
            LEFT JOIN "nudge_completions" nc ON ni.id = nc."nudgeInstanceId"
            JOIN "teams" t ON n."teamId" = t.id
            WHERE n.status = 'ACTIVE'
            AND t."companyId" = ${companyId}
            ${teamId ? Prisma.sql`AND n."teamId" = ${teamId}` : Prisma.empty}
            GROUP BY n.id, n.name
            HAVING COUNT(DISTINCT ni.id) > 0
            ORDER BY "completionRate" DESC, completions DESC
            LIMIT 10
        `
    );

    /* ---------------------------------------------------------
     * RECENT COMPLETIONS (native Prisma)
     * --------------------------------------------------------- */
    const recentCompletionsRaw = await prisma.nudgeCompletion.findMany({
        where: { nudge: teamFilter },
        include: {
            nudge: { select: { name: true } },
            nudgeInstance: { select: { scheduledFor: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    /* ---------------------------------------------------------
     * ACTIVE RECIPIENTS
     * --------------------------------------------------------- */
    const activeRecipients = await prisma.$queryRaw<ActiveRecipientRow[]>(
        Prisma.sql`
            SELECT 
                nre."recipientEmail" AS email,
                nre."recipientName" AS name,
                COUNT(DISTINCT CASE WHEN nre."completedAt" IS NOT NULL THEN nre.id END)::int AS completions,
                COUNT(DISTINCT nre.id)::int AS "totalSent",
                COALESCE(
                    (COUNT(DISTINCT CASE WHEN nre."completedAt" IS NOT NULL THEN nre.id END)::float 
                        / NULLIF(COUNT(DISTINCT nre.id)::float, 0)) * 100,
                    0
                ) AS "completionRate"
            FROM "nudge_recipient_events" nre
            JOIN "nudge_instances" ni ON nre."nudgeInstanceId" = ni.id
            JOIN "nudges" n ON ni."nudgeId" = n.id
            JOIN "teams" t ON n."teamId" = t.id
            WHERE t."companyId" = ${companyId}
            ${teamId ? Prisma.sql`AND n."teamId" = ${teamId}` : Prisma.empty}
            GROUP BY nre."recipientEmail", nre."recipientName"
            HAVING COUNT(DISTINCT nre.id) > 0
            ORDER BY completions DESC, "completionRate" DESC
            LIMIT 10
        `
    );

    /* ---------------------------------------------------------
     * PENDING/OVERDUE NUDGES (not completed)
     * --------------------------------------------------------- */
    type PendingNudgeInstance = Prisma.NudgeInstanceGetPayload<{
        include: {
            nudge: {
                include: {
                    team: true;
                };
            };
        };
    }>;

    const pendingNudgesRaw = (await prisma.nudgeInstance.findMany({
        where: {
            nudge: teamFilter,
            status: {
                in: ['PENDING', 'OVERDUE']
            }
        },
        include: {
            nudge: {
                include: {
                    team: true
                }
            }
        },
        orderBy: { scheduledFor: 'desc' },
        take: 50
    })) as PendingNudgeInstance[];

    /* ---------------------------------------------------------
     * NUDGES NEEDING ATTENTION
     * --------------------------------------------------------- */
    const nudgesNeedingAttention = await prisma.$queryRaw<AttentionRow[]>(
        Prisma.sql`
            SELECT 
                n.id AS "nudgeId",
                n.name AS "nudgeName",
                n.status,
                COALESCE(
                    (COUNT(DISTINCT nc.id)::float 
                        / NULLIF(COUNT(DISTINCT ni.id)::float, 0)) * 100,
                    0
                ) AS "completionRate",
                SUM(ni."overdueCount")::int AS "overdueCount",
                MAX(ni."scheduledFor") AS "lastInstanceDate"
            FROM "nudges" n
            LEFT JOIN "nudge_instances" ni ON n.id = ni."nudgeId"
            LEFT JOIN "nudge_completions" nc ON ni.id = nc."nudgeInstanceId"
            JOIN "teams" t ON n."teamId" = t.id
            WHERE n.status = 'ACTIVE'
            AND t."companyId" = ${companyId}
            ${teamId ? Prisma.sql`AND n."teamId" = ${teamId}` : Prisma.empty}
            GROUP BY n.id, n.name, n.status
            HAVING 
                COUNT(DISTINCT ni.id) > 3
                AND (
                    (COUNT(DISTINCT nc.id)::float 
                        / NULLIF(COUNT(DISTINCT ni.id)::float, 0)) * 100 < 50
                    OR SUM(ni."overdueCount") > 0
                )
            ORDER BY "completionRate" ASC, "overdueCount" DESC
            LIMIT 10
        `
    );

    /* ---------------------------------------------------------
     * FINAL NORMALIZED RESPONSE
     * --------------------------------------------------------- */
    return {
        overview: {
            totalNudges,
            totalCompletions,
            completionRate: Math.round(completionRate * 10) / 10,
            pendingInstances,
            failedInstances,
            totalRecipients,
            completionsWithComments
        },

        completionsOverTime: completionsOverTime.map((r) => ({
            date: r.date.toISOString().split('T')[0],
            count: r.count
        })),

        nudgesByFrequency: nudgesByFrequencyRaw.map((item) => ({
            frequency: item.frequency,
            count: item._count._all
        })),

        nudgesByStatus: nudgesByStatusRaw.map((item) => ({
            status: item.status,
            count: item._count._all
        })),

        teamPerformance: teamPerformance.map((item) => ({
            teamName: item.teamName,
            completionRate: Math.round(item.completionRate * 10) / 10
        })),

        topNudges: topNudges.map((item) => ({
            nudgeId: item.nudgeId,
            nudgeName: item.nudgeName,
            completions: item.completions,
            instances: item.instances,
            completionRate: Math.round(item.completionRate * 10) / 10
        })),

        recentCompletions: recentCompletionsRaw.map((item) => ({
            id: item.id,
            nudgeName: item.nudge.name,
            completedBy: item.completedByName || item.completedBy,
            completedAt: item.createdAt,
            scheduledFor: item.nudgeInstance.scheduledFor
        })),

        activeRecipients: activeRecipients.map((item) => ({
            email: item.email,
            name: item.name,
            completions: item.completions,
            totalSent: item.totalSent,
            completionRate: Math.round(item.completionRate * 10) / 10
        })),

        nudgesNeedingAttention: nudgesNeedingAttention.map((item) => ({
            nudgeId: item.nudgeId,
            nudgeName: item.nudgeName,
            status: item.status,
            completionRate: Math.round(item.completionRate * 10) / 10,
            overdueCount: item.overdueCount,
            lastInstanceDate: item.lastInstanceDate
        })),

        pendingNudges: pendingNudgesRaw.map((item) => ({
            id: item.id,
            nudgeId: item.nudgeId,
            nudgeName: item.nudge.name,
            teamName: item.nudge.team.name,
            scheduledFor: item.scheduledFor,
            status: item.status,
            overdueCount: item.overdueCount
        }))
    };
}
