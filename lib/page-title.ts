// lib/page-title.ts
import { prisma } from '@/lib/prisma';

// --------------------------------------------
// 🔹 Cache setup
// --------------------------------------------
type CacheEntry = { title: string; expires: number };
const TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();

// --------------------------------------------
// 🔹 Static route definitions
// --------------------------------------------
type RoutePattern = {
    pattern: RegExp | string;
    title: string | ((slug: string) => string);
};

const ROUTES: RoutePattern[] = [
    { pattern: '/', title: 'Dashboard' },
    { pattern: '/settings', title: 'Settings' },
    { pattern: '/company', title: 'Company Settings' },
    { pattern: '/team/create', title: 'Create a Team' },
    { pattern: '/team', title: 'Teams & Users' },
    { pattern: '/nudges', title: 'Nudges' },
    { pattern: '/nudges/create', title: 'Create Nudge' },
    { pattern: '/billing', title: 'Billing' },
    { pattern: '/subscription', title: 'Change Subscription' }
];

// --------------------------------------------
// 🔹 Static lookup helper
// --------------------------------------------
export function getPageTitle(pathname: string): string {
    for (const route of ROUTES) {
        if (typeof route.pattern === 'string' && route.pattern === pathname) {
            return typeof route.title === 'string'
                ? route.title
                : route.title('');
        }
        if (route.pattern instanceof RegExp && route.pattern.test(pathname)) {
            const slug = pathname.split('/').pop()!;
            return typeof route.title === 'string'
                ? route.title
                : route.title(slug);
        }
    }
    return 'Page';
}

// --------------------------------------------
// 🔹 Async lookup with DB + cache
// --------------------------------------------
export async function getPageTitleAsync(pathname: string): Promise<string> {
    const now = Date.now();
    const cached = cache.get(pathname);
    if (cached && cached.expires > now) {
        return cached.title;
    }

    let title: string | null = null;

    try {
        // Example: /nudges/[id]
        if (/^\/nudges\/\w+$/.test(pathname)) {
            const id = pathname.split('/').pop()!;
            const nudge = await prisma.nudge.findUnique({
                where: { id },
                select: { name: true }
            });
            title = nudge?.name ? `Nudge - ${nudge.name}` : 'Nudge Details';
        }

        // Example: /team/[id]
        if (!title && /^\/team\/\w+$/.test(pathname)) {
            const id = pathname.split('/').pop()!;
            const team = await prisma.team.findUnique({
                where: { id },
                select: { name: true }
            });
            title = team?.name ? `Team - ${team.name}` : 'Manage Team';
        }
    } catch (error) {
        console.error(`Error fetching page title for ${pathname}:`, error);
    }

    // Fallback to static
    title ||= getPageTitle(pathname);

    // Store in cache
    cache.set(pathname, { title, expires: now + TTL_MS });

    return title;
}
