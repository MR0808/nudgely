'use server';

// import { PrismaClient } from "@prisma/client"
// const prisma = new PrismaClient()

export async function getDashboardStats() {
    // TODO: Replace with actual Prisma queries
    // const [totalUsers, activeUsers, totalCompanies, etc.] = await Promise.all([
    //   prisma.user.count(),
    //   prisma.user.count({ where: { status: 'ACTIVE' }}),
    //   prisma.company.count(),
    //   ...
    // ])

    return {
        totalUsers: 1247,
        activeUsers: 1156,
        userGrowth: 12.5,
        totalCompanies: 342,
        activeCompanies: 318,
        companyGrowth: 8.3,
        totalTeams: 856,
        activeTeams: 798,
        teamGrowth: 15.2,
        activeSubscriptions: 295,
        mrr: 45680,
        subscriptionGrowth: 6.7,
        activeNudges: 2341,
        pendingInstances: 487,
        totalTemplates: 156,
        activeTemplates: 142,
        systemAlerts: [
            '3 subscriptions expiring in next 7 days',
            '12 pending company invitations older than 14 days',
            'Nudge cron job last run: 2 hours ago'
        ]
    };
}

