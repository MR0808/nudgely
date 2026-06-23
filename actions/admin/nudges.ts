'use server';

import { NudgeStatus } from '@/generated/prisma/client';
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSiteAdmin } from '@/lib/require-site-admin';

type NudgeRow = Prisma.NudgeGetPayload<{
    include: {
        team: {
            select: {
                name: true;
                company: { select: { name: true } };
            };
        };
        _count: { select: { recipients: true; instances: true } };
    };
}>;

export async function getNudges(searchParams: {
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
                    team: {
                        company: {
                            name: {
                                contains: search,
                                mode: 'insensitive' as const
                            }
                        }
                    }
                }
            ]
        }),
        ...(status && status !== 'all' && { status: status as NudgeStatus })
    };

    const [nudgesRaw, totalCount] = await Promise.all([
        prisma.nudge.findMany({
            where,
            include: {
                team: {
                    select: {
                        name: true,
                        company: { select: { name: true } }
                    }
                },
                _count: { select: { recipients: true, instances: true } }
            },
            orderBy: { createdAt: 'desc' },
            ...(pageSize !== -1 && {
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        }),
        prisma.nudge.count({ where })
    ]);

    const nudges = nudgesRaw as unknown as NudgeRow[];

    return { nudges, totalCount };
}
