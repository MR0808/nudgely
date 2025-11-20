'use server';

import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

import type {
    CreateAuditLogParams,
    AuditLogFilters,
    AuditLogResult
} from '@/types/audit';

/* -------------------------------------------------------
 *  Types for Prisma GroupBy outputs (Accelerate-safe)
 * ----------------------------------------------------- */

type EventsByCategory = {
    category: string;
    _count: { category: number };
};

type EventsByAction = {
    action: string;
    _count: { action: number };
};

/* -------------------------------------------------------
 *  Create Audit Event
 * ----------------------------------------------------- */

export async function logAuditEvent(
    params: CreateAuditLogParams
): Promise<AuditLogResult> {
    try {
        const headersList = await headers();

        const ipAddress =
            params.ipAddress ||
            headersList.get('x-forwarded-for') ||
            headersList.get('x-real-ip') ||
            'unknown';

        const userAgent =
            params.userAgent || headersList.get('user-agent') || 'unknown';

        await prisma.auditLog.create({
            data: {
                userId: params.userId || null,
                action: params.action,
                category: params.category,
                description: params.description || null,
                ipAddress,
                userAgent,
                metadata: params.metadata || {},
                sessionId: params.sessionId || null
            }
        });

        return {
            success: true,
            message: 'Audit event logged successfully'
        };
    } catch (error) {
        console.error('Failed to log audit event:', error);
        return {
            success: false,
            error: 'Failed to log audit event'
        };
    }
}

/* -------------------------------------------------------
 *  Get Audit Logs with Filters
 * ----------------------------------------------------- */

export async function getAuditLogs(filters: AuditLogFilters = {}) {
    try {
        const where: any = {};

        if (filters.userId) where.userId = filters.userId;
        if (filters.category) where.category = filters.category;
        if (filters.action) where.action = filters.action;
        if (filters.ipAddress) where.ipAddress = filters.ipAddress;
        if (filters.sessionId) where.sessionId = filters.sessionId;

        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = filters.startDate;
            if (filters.endDate) where.createdAt.lte = filters.endDate;
        }

        const logs = await prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        lastName: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: filters.limit || 100,
            skip: filters.skip || 0
        });

        return { success: true, data: logs };
    } catch (error) {
        console.error('Failed to get audit logs:', error);
        return {
            success: false,
            error: 'Failed to retrieve audit logs'
        };
    }
}

/* -------------------------------------------------------
 *  Get Audit Statistics
 * ----------------------------------------------------- */

export async function getAuditStats(userId?: string) {
    try {
        const where = userId ? { userId } : {};

        const [
            totalEvents,
            eventsByCategoryRaw,
            eventsByActionRaw,
            recentEvents
        ] = await Promise.all([
            prisma.auditLog.count({ where }),

            prisma.auditLog.groupBy({
                by: ['category'],
                where,
                _count: { category: true }
            }) as unknown as EventsByCategory[],

            prisma.auditLog.groupBy({
                by: ['action'],
                where,
                _count: { action: true },
                orderBy: { _count: { action: 'desc' } },
                take: 10
            }) as unknown as EventsByAction[],

            prisma.auditLog.count({
                where: {
                    ...where,
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                }
            })
        ]);

        const eventsByCategory: Record<string, number> = {};
        eventsByCategoryRaw.forEach((item) => {
            eventsByCategory[item.category] = item._count.category;
        });

        const eventsByAction: Record<string, number> = {};
        eventsByActionRaw.forEach((item) => {
            eventsByAction[item.action] = item._count.action;
        });

        return {
            success: true,
            data: {
                totalEvents,
                eventsByCategory,
                eventsByAction,
                recentActivityCount: recentEvents
            }
        };
    } catch (error) {
        console.error('Failed to get audit statistics:', error);
        return {
            success: false,
            error: 'Failed to retrieve audit statistics'
        };
    }
}

/* -------------------------------------------------------
 *  Delete Old Logs (Cleanup)
 * ----------------------------------------------------- */

export async function cleanupOldAuditLogs(
    olderThanDays: number
): Promise<AuditLogResult & { deletedCount?: number }> {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const result = await prisma.auditLog.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate
                }
            }
        });

        return {
            success: true,
            message: `Deleted ${result.count} old audit log entries`,
            deletedCount: result.count
        };
    } catch (error) {
        console.error('Failed to cleanup audit logs:', error);
        return {
            success: false,
            error: 'Failed to cleanup audit logs'
        };
    }
}
