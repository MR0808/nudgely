// lib/page-title.ts
import 'server-only';

import { prisma } from '@/lib/prisma';

// STATIC ROUTES → titles
export function getStaticRouteTitle(pathname: string): string | null {
    const map: Record<string, string> = {
        '/': 'Dashboard',
        '/settings': 'Settings',
        '/team': 'Team',
        '/team/create': 'Create Team',
        '/company': 'Company',
        '/dashboard': 'Dashboard'
    };

    return map[pathname] ?? null;
}

// DYNAMIC ROUTES → DB-backed titles
export async function getDynamicRouteTitle(
    pathname: string
): Promise<string | null> {
    const segments = pathname.split('/').filter(Boolean);

    // /team/[id]
    if (segments[0] === 'team' && segments.length === 2) {
        const id = segments[1];
        const team = await prisma.team.findUnique({
            where: { id },
            select: { name: true }
        });
        return team?.name ?? 'Team';
    }

    // /nudges/[id]
    if (segments[0] === 'nudges' && segments.length === 2) {
        const id = segments[1];
        const nudge = await prisma.nudge.findUnique({
            where: { id },
            select: { name: true }
        });
        return nudge?.name ?? 'Nudge';
    }

    // Add more patterns as needed:
    // if (segments[0] === 'projects' && segments.length === 2) { ... }

    return null;
}

// Strip global prefix etc, if you use "Nudgely | X"
export function cleanTitle(str: string) {
    if (!str) return '';
    return str.replace(/^Nudgely\s*\|\s*/i, '').trim();
}
