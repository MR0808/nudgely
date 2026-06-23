'use server';

import { SiteRole, UserStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logAdminAction } from '@/lib/admin-audit';
import { assertAdminCanModifyUser } from '@/lib/admin-user-guards';
import { requireSiteAdmin } from '@/lib/require-site-admin';
import {
    revokeCompanyMemberSessions,
    revokeUserSessions
} from '@/lib/revoke-user-sessions';

export async function getUsers(searchParams: {
    [key: string]: string | string[] | undefined;
}) {
    await requireSiteAdmin();
    const search = searchParams.search as string | undefined;
    const status = searchParams.status as string | undefined;
    const role = searchParams.role as string | undefined;
    const page = parseInt((searchParams.page as string) || '1', 10);
    const pageSize = parseInt((searchParams.pageSize as string) || '20', 10);

    const where = {
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
    const session = await requireSiteAdmin();
    await assertAdminCanModifyUser(session.user.id, userId);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    await prisma.user.update({
        where: { id: userId },
        data: { role }
    });

    await logAdminAction(
        session.user.id,
        'admin.role_assigned',
        `Changed role for ${user.email} to ${role}`,
        { targetUserId: userId, previousRole: user.role, newRole: role }
    );

    return { success: true };
}

export async function toggleUserStatus(userId: string) {
    const session = await requireSiteAdmin();
    await assertAdminCanModifyUser(session.user.id, userId);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';

    await prisma.user.update({
        where: { id: userId },
        data: { status: newStatus }
    });

    if (newStatus === 'DISABLED') {
        await revokeUserSessions(userId);
    }

    await logAdminAction(
        session.user.id,
        'admin.user_status_changed',
        `${newStatus === 'DISABLED' ? 'Disabled' : 'Enabled'} user ${user.email}`,
        { targetUserId: userId, previousStatus: user.status, newStatus }
    );

    return { success: true };
}

export async function banUser(
    userId: string,
    reason: string,
    expiresAt?: Date
) {
    const session = await requireSiteAdmin();
    await assertAdminCanModifyUser(session.user.id, userId);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    await prisma.user.update({
        where: { id: userId },
        data: {
            banned: true,
            banReason: reason,
            banExpires: expiresAt,
            status: 'BANNED'
        }
    });

    await revokeUserSessions(userId);

    await logAdminAction(
        session.user.id,
        'admin.user_banned',
        `Banned user ${user.email}`,
        {
            targetUserId: userId,
            reason,
            banExpires: expiresAt?.toISOString() ?? null
        }
    );

    return { success: true };
}

export async function unbanUser(userId: string) {
    const session = await requireSiteAdmin();
    await assertAdminCanModifyUser(session.user.id, userId);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    await prisma.user.update({
        where: { id: userId },
        data: {
            banned: false,
            banReason: null,
            banExpires: null,
            status: 'ACTIVE'
        }
    });

    await logAdminAction(
        session.user.id,
        'admin.user_unbanned',
        `Unbanned user ${user.email}`,
        { targetUserId: userId }
    );

    return { success: true };
}

export async function deleteUser(userId: string) {
    const session = await requireSiteAdmin();
    await assertAdminCanModifyUser(session.user.id, userId);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    await prisma.user.update({
        where: { id: userId },
        data: { status: 'DISABLED' as UserStatus }
    });

    await revokeUserSessions(userId);

    await logAdminAction(
        session.user.id,
        'admin.user_deleted',
        `Soft-deleted (disabled) user ${user.email}`,
        { targetUserId: userId }
    );

    return { success: true };
}

export async function getUserDetails(userId: string) {
    await requireSiteAdmin();
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
    await requireSiteAdmin();
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
    await requireSiteAdmin();
    const logs = await prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
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
