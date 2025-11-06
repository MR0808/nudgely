'use server';

import { prisma } from '@/lib/prisma';

export const getDashboardStats = async (teamId?: string) => {
    // Base where clause for filtering by team
    const teamFilter = teamId ? { teamId } : {};

    // Overview stats
    const totalNudges = await prisma.nudge.count({
        where: { ...teamFilter, status: 'ACTIVE' }
    });
    const totalCompletions = await prisma.nudgeCompletion.count({
        where: teamId ? { nudge: { teamId } } : {}
    });
    const totalInstances = await prisma.nudgeInstance.count({
        where: teamId ? { nudge: { teamId } } : {}
    });
    const pendingInstances = await prisma.nudgeInstance.count({
        where: {
            ...(teamFilter ? { nudge: teamFilter } : {}),
            status: 'PENDING'
        }
    });
    const completionRate =
        totalInstances > 0 ? (totalCompletions / totalInstances) * 100 : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completionsOverTime = teamId
        ? await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT DATE(nc."createdAt") as date, COUNT(*)::int as count
        FROM "nudge_completions" nc
        JOIN "nudges" n ON nc."nudgeId" = n.id
        WHERE n."teamId" = ${teamId}
        AND nc."createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE(nc."createdAt")
        ORDER BY date ASC
      `
        : await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT DATE(nc."createdAt") as date, COUNT(*)::int as count
        FROM "nudge_completions" nc
        WHERE nc."createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE(nc."createdAt")
        ORDER BY date ASC
      `;

    // Nudges by frequency
    const nudgesByFrequency = await prisma.nudge.groupBy({
        by: ['frequency'],
        where: { ...teamFilter, status: 'ACTIVE' },
        _count: true
    });

    // Nudges by status
    const nudgesByStatus = await prisma.nudge.groupBy({
        by: ['status'],
        where: teamFilter,
        _count: true
    });

    const teamPerformance = teamId
        ? await prisma.$queryRaw<
              Array<{
                  teamId: string;
                  teamName: string;
                  completionRate: number;
              }>
          >`
        SELECT 
          t.id as "teamId",
          t.name as "teamName",
          COALESCE(
            (COUNT(DISTINCT nc.id)::float / NULLIF(COUNT(DISTINCT ni.id)::float, 0)) * 100,
            0
          ) as "completionRate"
        FROM "teams" t
        LEFT JOIN "nudges" n ON t.id = n."teamId"
        LEFT JOIN "nudge_instances" ni ON n.id = ni."nudgeId"
        LEFT JOIN "nudge_completions" nc ON ni.id = nc."nudgeInstanceId"
        WHERE t.status = 'ACTIVE' AND t.id = ${teamId}
        GROUP BY t.id, t.name
        ORDER BY "completionRate" DESC
        LIMIT 10
      `
        : await prisma.$queryRaw<
              Array<{
                  teamId: string;
                  teamName: string;
                  completionRate: number;
              }>
          >`
        SELECT 
          t.id as "teamId",
          t.name as "teamName",
          COALESCE(
            (COUNT(DISTINCT nc.id)::float / NULLIF(COUNT(DISTINCT ni.id)::float, 0)) * 100,
            0
          ) as "completionRate"
        FROM "teams" t
        LEFT JOIN "nudges" n ON t.id = n."teamId"
        LEFT JOIN "nudge_instances" ni ON n.id = ni."nudgeId"
        LEFT JOIN "nudge_completions" nc ON ni.id = nc."nudgeInstanceId"
        WHERE t.status = 'ACTIVE'
        GROUP BY t.id, t.name
        ORDER BY "completionRate" DESC
        LIMIT 10
      `;

    const topNudges = teamId
        ? await prisma.$queryRaw<
              Array<{
                  nudgeId: string;
                  nudgeName: string;
                  completions: bigint;
                  instances: bigint;
                  completionRate: number;
              }>
          >`
        SELECT 
          n.id as "nudgeId",
          n.name as "nudgeName",
          COUNT(DISTINCT nc.id)::int as completions,
          COUNT(DISTINCT ni.id)::int as instances,
          COALESCE(
            (COUNT(DISTINCT nc.id)::float / NULLIF(COUNT(DISTINCT ni.id)::float, 0)) * 100,
            0
          ) as "completionRate"
        FROM "nudges" n
        LEFT JOIN "nudge_instances" ni ON n.id = ni."nudgeId"
        LEFT JOIN "nudge_completions" nc ON ni.id = nc."nudgeInstanceId"
        WHERE n.status = 'ACTIVE' AND n."teamId" = ${teamId}
        GROUP BY n.id, n.name
        HAVING COUNT(DISTINCT ni.id) > 0
        ORDER BY "completionRate" DESC, completions DESC
        LIMIT 10
      `
        : await prisma.$queryRaw<
              Array<{
                  nudgeId: string;
                  nudgeName: string;
                  completions: bigint;
                  instances: bigint;
                  completionRate: number;
              }>
          >`
        SELECT 
          n.id as "nudgeName",
          n.name as "nudgeName",
          COUNT(DISTINCT nc.id)::int as completions,
          COUNT(DISTINCT ni.id)::int as instances,
          COALESCE(
            (COUNT(DISTINCT nc.id)::float / NULLIF(COUNT(DISTINCT ni.id)::float, 0)) * 100,
            0
          ) as "completionRate"
        FROM "nudges" n
        LEFT JOIN "nudge_instances" ni ON n.id = ni."nudgeId"
        LEFT JOIN "nudge_completions" nc ON ni.id = nc."nudgeInstanceId"
        WHERE n.status = 'ACTIVE'
        GROUP BY n.id, n.name
        HAVING COUNT(DISTINCT ni.id) > 0
        ORDER BY "completionRate" DESC, completions DESC
        LIMIT 10
      `;

    // Recent completions
    const recentCompletions = await prisma.nudgeCompletion.findMany({
        where: teamId ? { nudge: { teamId } } : {},
        include: {
            nudge: { select: { name: true } },
            nudgeInstance: { select: { scheduledFor: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    const activeRecipients = teamId
        ? await prisma.$queryRaw<
              Array<{
                  email: string;
                  name: string;
                  completions: bigint;
                  totalSent: bigint;
                  completionRate: number;
              }>
          >`
        SELECT 
          nre."recipientEmail" as email,
          nre."recipientName" as name,
          COUNT(DISTINCT CASE WHEN nre."completedAt" IS NOT NULL THEN nre.id END)::int as completions,
          COUNT(DISTINCT nre.id)::int as "totalSent",
          COALESCE(
            (COUNT(DISTINCT CASE WHEN nre."completedAt" IS NOT NULL THEN nre.id END)::float / NULLIF(COUNT(DISTINCT nre.id)::float, 0)) * 100,
            0
          ) as "completionRate"
        FROM "nudge_recipient_events" nre
        JOIN "nudge_instances" ni ON nre."nudgeInstanceId" = ni.id
        JOIN "nudges" n ON ni."nudgeId" = n.id
        WHERE n."teamId" = ${teamId}
        GROUP BY nre."recipientEmail", nre."recipientName"
        HAVING COUNT(DISTINCT nre.id) > 0
        ORDER BY completions DESC, "completionRate" DESC
        LIMIT 10
      `
        : await prisma.$queryRaw<
              Array<{
                  email: string;
                  name: string;
                  completions: bigint;
                  totalSent: bigint;
                  completionRate: number;
              }>
          >`
        SELECT 
          nre."recipientEmail" as email,
          nre."recipientName" as name,
          COUNT(DISTINCT CASE WHEN nre."completedAt" IS NOT NULL THEN nre.id END)::int as completions,
          COUNT(DISTINCT nre.id)::int as "totalSent",
          COALESCE(
            (COUNT(DISTINCT CASE WHEN nre."completedAt" IS NOT NULL THEN nre.id END)::float / NULLIF(COUNT(DISTINCT nre.id)::float, 0)) * 100,
            0
          ) as "completionRate"
        FROM "nudge_recipient_events" nre
        JOIN "nudge_instances" ni ON nre."nudgeInstanceId" = ni.id
        JOIN "nudges" n ON ni."nudgeId" = n.id
        GROUP BY nre."recipientEmail", nre."recipientName"
        HAVING COUNT(DISTINCT nre.id) > 0
        ORDER BY completions DESC, "completionRate" DESC
        LIMIT 10
      `;

    const nudgesNeedingAttention = teamId
        ? await prisma.$queryRaw<
              Array<{
                  nudgeId: string;
                  nudgeName: string;
                  status: string;
                  completionRate: number;
                  overdueCount: bigint;
                  lastInstanceDate: Date | null;
              }>
          >`
        SELECT 
          n.id as "nudgeId",
          n.name as "nudgeName",
          n.status,
          COALESCE(
            (COUNT(DISTINCT nc.id)::float / NULLIF(COUNT(DISTINCT ni.id)::float, 0)) * 100,
            0
          ) as "completionRate",
          SUM(ni."overdueCount")::int as "overdueCount",
          MAX(ni."scheduledFor") as "lastInstanceDate"
        FROM "nudges" n
        LEFT JOIN "nudge_instances" ni ON n.id = ni."nudgeId"
        LEFT JOIN "nudge_completions" nc ON ni.id = nc."nudgeInstanceId"
        WHERE n.status = 'ACTIVE' AND n."teamId" = ${teamId}
        GROUP BY n.id, n.name, n.status
        HAVING 
          COUNT(DISTINCT ni.id) > 3 AND (
            (COUNT(DISTINCT nc.id)::float / NULLIF(COUNT(DISTINCT ni.id)::float, 0)) * 100 < 50
            OR SUM(ni."overdueCount") > 0
          )
        ORDER BY "completionRate" ASC, "overdueCount" DESC
        LIMIT 10
      `
        : await prisma.$queryRaw<
              Array<{
                  nudgeId: string;
                  nudgeName: string;
                  status: string;
                  completionRate: number;
                  overdueCount: bigint;
                  lastInstanceDate: Date | null;
              }>
          >`
        SELECT 
          n.id as "nudgeId",
          n.name as "nudgeName",
          n.status,
          COALESCE(
            (COUNT(DISTINCT nc.id)::float / NULLIF(COUNT(DISTINCT ni.id)::float, 0)) * 100,
            0
          ) as "completionRate",
          SUM(ni."overdueCount")::int as "overdueCount",
          MAX(ni."scheduledFor") as "lastInstanceDate"
        FROM "nudges" n
        LEFT JOIN "nudge_instances" ni ON n.id = ni."nudgeId"
        LEFT JOIN "nudge_completions" nc ON ni.id = nc."nudgeInstanceId"
        WHERE n.status = 'ACTIVE'
        GROUP BY n.id, n.name, n.status
        HAVING 
          COUNT(DISTINCT ni.id) > 3 AND (
            (COUNT(DISTINCT nc.id)::float / NULLIF(COUNT(DISTINCT ni.id)::float, 0)) * 100 < 50
            OR SUM(ni."overdueCount") > 0
          )
        ORDER BY "completionRate" ASC, "overdueCount" DESC
        LIMIT 10
      `;

    // Additional stats
    const failedInstances = await prisma.nudgeInstance.count({
        where: {
            ...(teamFilter ? { nudge: teamFilter } : {}),
            status: 'FAILED'
        }
    });

    const totalRecipients = await prisma.nudgeRecipient.count({
        where: teamId
            ? {
                  nudge: {
                      teamId: teamId
                  }
              }
            : {}
    });

    const completionsWithComments = await prisma.nudgeCompletion.count({
        where: {
            ...(teamId ? { nudge: { teamId } } : {}),
            comments: { not: null }
        }
    });

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
        completionsOverTime: completionsOverTime.map((row) => ({
            date: row.date.toISOString().split('T')[0],
            count: Number(row.count)
        })),
        nudgesByFrequency: nudgesByFrequency.map((item) => ({
            frequency: item.frequency,
            count: item._count
        })),
        nudgesByStatus: nudgesByStatus.map((item) => ({
            status: item.status,
            count: item._count
        })),
        teamPerformance: teamPerformance.map((item) => ({
            teamName: item.teamName,
            completionRate: Math.round(Number(item.completionRate) * 10) / 10
        })),
        topNudges: topNudges.map((item) => ({
            nudgeName: item.nudgeName,
            completions: Number(item.completions),
            instances: Number(item.instances),
            completionRate: Math.round(Number(item.completionRate) * 10) / 10
        })),
        recentCompletions: recentCompletions.map((item) => ({
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
