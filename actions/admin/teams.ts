'use server';

import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSiteAdmin } from '@/lib/require-site-admin';

type TeamRow = Prisma.TeamGetPayload<{
    include: {
        company: { select: { id: true; name: true; slug: true } };
        _count: { select: { members: true; nudges: true } };
    };
}>;

export async function getTeams(searchParams: {
    [key: string]: string | string[] | undefined;
}) {
    await requireSiteAdmin();

    const page = parseInt((searchParams.page as string) || '1', 10);
    const pageSize = parseInt((searchParams.pageSize as string) || '20', 10);
    const search = searchParams.search as string | undefined;
    const status = searchParams.status as string | undefined;

    const where = {
        ...(search && {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                {
                    company: {
                        name: { contains: search, mode: 'insensitive' as const }
                    }
                }
            ]
        }),
        ...(status && status !== 'all' && { status: status as 'ACTIVE' | 'DISABLED' })
    };

    const [teamsRaw, totalCount] = await Promise.all([
        prisma.team.findMany({
            where,
            include: {
                company: { select: { id: true, name: true, slug: true } },
                _count: { select: { members: true, nudges: true } }
            },
            orderBy: { createdAt: 'desc' },
            ...(pageSize !== -1 && {
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        }),
        prisma.team.count({ where })
    ]);

    const teams = teamsRaw as unknown as TeamRow[];

    return { teams, totalCount };
}
