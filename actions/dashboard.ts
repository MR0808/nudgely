'use server';

import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';

/* -------------------------------------------------------------
 * Types for raw SQL results
 * ------------------------------------------------------------- */

type CompletionsOverTimeRow = { date: Date; count: bigint };

type TeamPerformanceRow = {
    teamId: string;
    teamName: string;
    completionRate: number;
};

type TopNudgeRow = {
    nudgeId: string;
    nudgeName: string;
    completions: bigint;
    instances: bigint;
    completionRate: number;
};

type ActiveRecipientRow = {
    email: string;
    name: string;
    completions: bigint;
    totalSent: bigint;
    completionRate: number;
};

type AttentionRow = {
    nudgeId: string;
    nudgeName: string;
    status: string;
    completionRate: number;
    overdueCount: bigint;
    lastInstanceDate: Date | null;
};

/* -------------------------------------------------------------
 * Main dashboard stats action
 * ------------------------------------------------------------- */

export const getDashboardStats = async (teamId?: string) => {
    const teamFilter = teamId ? { teamId } : {};

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    /* ---------------------------------------------------------
     * Basic counts (parallelised & fast)
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
            where: teamId ? { nudge: { teamId } } : {}
        }),

        prisma.nudgeInstance.count({
            where: teamId ? { nudge: { teamId } } : {}
        }),

        prisma.nudgeInstance.count({
            where: {
                ...(teamId ? { nudge: teamFilter } : {}),
                status: 'PENDING'
            }
        }),

        prisma.nudgeInstance.count({
            where: {
                ...(teamId ? { nudge: teamFilter } : {}),
                status: 'FAILED'
            }
        }),

        prisma.nudgeRecipient.count({
            where: teamId ? { nudge: { teamId } } : {}
        }),

        prisma.nudgeCompletion.count({
            where: {
                ...(teamId ? { nudge: { teamId } } : {}),
                comments: { not: null }
            }
        })
    ]);

    const completionRate =
        totalInstances > 0 ? (totalCompletions / totalInstances) * 100 : 0;

    /* ---------------------------------------------------------
     * Completions Over Time (Prisma Accelerate-safe SQL)
     * --------------------------------------------------------- */
    const completionsOverTime = await prisma.$queryRaw<
        CompletionsOverTimeRow[]
    >(Prisma.sql`
        SELECT 
            DATE(nc."createdAt") AS date,
            COUNT(*)::int AS count
        FROM "nudge_completions" nc
        ${teamId ? Prisma.sql`JOIN "nudges" n ON nc."nudgeId" = n.id` : Prisma.empty}
        WHERE nc."createdAt" >= ${thirtyDaysAgo}
        ${teamId ? Prisma.sql`AND n."teamId" = ${teamId}` : Prisma.empty}
        GROUP BY DATE(nc."createdAt")
        ORDER BY date ASC
    `);

    /* ---------------------------------------------------------
     * Nudges grouped by frequency / status (fully typed)
     * --------------------------------------------------------- */
    const nudgesByFrequencyRaw = await prisma.nudge.groupBy({
        by: ['frequency'],
        where: { ...teamFilter, status: 'ACTIVE' },
        _count: { _all: true }
    });

    const nudgesByStatusRaw = await prisma.nudge.groupBy({
        by: ['status'],
        where: teamFilter,
        _count: { _all: true }
    });

    // Strong typing fixes the "{}" error
    const nudgesByFrequency = nudgesByFrequencyRaw as Array<{
        frequency: string;
        _count: { _all: number };
    }>;

    const nudgesByStatus = nudgesByStatusRaw as Array<{
        status: string;
        _count: { _all: number };
    }>;

    /* ---------------------------------------------------------
     * Team performance ranking
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
        ${teamId ? Prisma.sql`AND t.id = ${teamId}` : Prisma.empty}
        GROUP BY t.id, t.name
        ORDER BY "completionRate" DESC
        LIMIT 10
    `
    );

    /* ---------------------------------------------------------
     * Top nudges
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
        WHERE n.status = 'ACTIVE'
        ${teamId ? Prisma.sql`AND n."teamId" = ${teamId}` : Prisma.empty}
        GROUP BY n.id, n.name
        HAVING COUNT(DISTINCT ni.id) > 0
        ORDER BY "completionRate" DESC, completions DESC
        LIMIT 10
    `
    );

    /* ---------------------------------------------------------
     * Recent completions (native Prisma)
     * --------------------------------------------------------- */
    const recentCompletionsRaw = await prisma.nudgeCompletion.findMany({
        where: teamId ? { nudge: { teamId } } : {},
        include: {
            nudge: { select: { name: true } },
            nudgeInstance: { select: { scheduledFor: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    /* ---------------------------------------------------------
     * Most active recipients
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
        ${teamId ? Prisma.sql`WHERE n."teamId" = ${teamId}` : Prisma.empty}
        GROUP BY nre."recipientEmail", nre."recipientName"
        HAVING COUNT(DISTINCT nre.id) > 0
        ORDER BY completions DESC, "completionRate" DESC
        LIMIT 10
    `
    );

    /* ---------------------------------------------------------
     * Nudges needing attention
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
        WHERE n.status = 'ACTIVE'
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
     * Final response mapping
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
            count: Number(r.count)
        })),

        nudgesByFrequency: nudgesByFrequency.map((item) => ({
            frequency: item.frequency,
            count: item._count._all
        })),

        nudgesByStatus: nudgesByStatus.map((item) => ({
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
            completions: Number(item.completions),
            instances: Number(item.instances),
            completionRate: Math.round(Number(item.completionRate) * 10) / 10
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
            completions: Number(item.completions),
            totalSent: Number(item.totalSent),
            completionRate: Math.round(Number(item.completionRate) * 10) / 10
        })),

        nudgesNeedingAttention: nudgesNeedingAttention.map((item) => ({
            nudgeId: item.nudgeId,
            nudgeName: item.nudgeName,
            status: item.status,
            completionRate: Math.round(Number(item.completionRate) * 10) / 10,
            overdueCount: Number(item.overdueCount),
            lastInstanceDate: item.lastInstanceDate
        }))
    };
};
