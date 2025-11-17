'use server';

import { Prisma, SiteRole, UserStatus } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';

export async function getUsers(searchParams: {
    [key: string]: string | string[] | undefined;
}) {
    const search = searchParams.search as string | undefined;
    const status = searchParams.status as string | undefined;
    const role = searchParams.role as string | undefined;
    const page = parseInt((searchParams.page as string) || '1', 10);
    const pageSize = parseInt((searchParams.pageSize as string) || '20', 10);

    const where: Prisma.UserWhereInput = {
        ...(search && {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                {
                    lastName: { contains: search, mode: 'insensitive' as const }
                },
                { email: { contains: search, mode: 'insensitive' as const } },
                { phoneNumber: { contains: search } }
            ]
        }),
        ...(status && status !== 'all' && { status: status as UserStatus }),
        ...(role && role !== 'all' && { role: role as SiteRole })
    };

    const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            ...(pageSize !== -1 && {
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        }),
        prisma.user.count({ where })
    ]);

    return { users, totalCount };
}

export async function updateUserRole(
    userId: string,
    role: 'USER' | 'SITE_ADMIN'
) {
    await prisma.user.update({
        where: { id: userId },
        data: { role }
    });
    return { success: true };
}

export async function toggleUserStatus(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new Error('User not found');
    }

    await prisma.user.update({
        where: { id: userId },
        data: { status: user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' }
    });
    return { success: true };
}

export async function banUser(
    userId: string,
    reason: string,
    expiresAt?: Date
) {
    await prisma.user.update({
        where: { id: userId },
        data: {
            banned: true,
            banReason: reason,
            banExpires: expiresAt,
            status: 'BANNED'
        }
    });
    return { success: true };
}

export async function unbanUser(userId: string) {
    await prisma.user.update({
        where: { id: userId },
        data: {
            banned: false,
            banReason: null,
            banExpires: null,
            status: 'ACTIVE'
        }
    });
    return { success: true };
}

export async function deleteUser(userId: string) {
    await prisma.user.update({
        where: { id: userId },
        data: { status: 'DISABLED' as UserStatus }
    });
    return { success: true };
}

export async function getUserDetails(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            country: { select: { name: true } },
            region: { select: { name: true } }
        }
    });

    if (!user) {
        throw new Error('User not found');
    }

    return user;
}

export async function getUserStats(userId: string) {
    const [
        totalCompanies,
        totalTeams,
        totalNudgesCreated,
        totalNudgesCompleted,
        lastSession
    ] = await Promise.all([
        prisma.company.count({ where: { creatorId: userId } }),
        prisma.team.count({ where: { creatorId: userId } }),
        prisma.nudge.count({ where: { creatorId: userId } }),
        prisma.nudgeCompletion.count({ where: { userId } }),
        prisma.session.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
        })
    ]);

    return {
        totalCompanies,
        totalTeams,
        totalNudgesCreated,
        totalNudgesCompleted,
        lastLoginAt: lastSession?.createdAt || null
    };
}

export async function getUserAuditLogs(userId: string) {
    const logs = await prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit to most recent 50 logs
        select: {
            id: true,
            action: true,
            category: true,
            description: true,
            ipAddress: true,
            createdAt: true
        }
    });

    return logs;
}
