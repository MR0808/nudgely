'use server';

import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSiteAdmin } from '@/lib/require-site-admin';
import type { AuditCategory } from '@/types/audit';

type AuditLogRow = Prisma.AuditLogGetPayload<{
    include: {
        user: {
            select: {
                id: true;
                email: true;
                name: true;
                lastName: true;
            };
        };
    };
}>;

export async function getAdminAuditLogs(searchParams: {
    [key: string]: string | string[] | undefined;
}) {
    await requireSiteAdmin();

    const page = parseInt((searchParams.page as string) || '1', 10);
    const pageSize = parseInt((searchParams.pageSize as string) || '50', 10);
    const category = searchParams.category as string | undefined;
    const action = searchParams.action as string | undefined;

    const where = {
        ...(category && category !== 'all' && { category }),
        ...(action && action !== 'all' && { action })
    };

    const [logsRaw, totalCount] = await Promise.all([
        prisma.auditLog.findMany({
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
            ...(pageSize !== -1 && {
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        }),
        prisma.auditLog.count({ where })
    ]);

    const logs = logsRaw as unknown as AuditLogRow[];

    return { logs, totalCount };
}

export async function getAuditCategories(): Promise<AuditCategory[]> {
    await requireSiteAdmin();
    const rows = (await prisma.auditLog.groupBy({
        by: ['category'],
        _count: { category: true },
        orderBy: { category: 'asc' }
    })) as Array<{ category: string; _count: { category: number } }>;

    return rows.map((row) => row.category as AuditCategory);
}
