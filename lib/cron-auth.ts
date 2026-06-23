import { type NextRequest, NextResponse } from 'next/server';

function isVercelCronRequest(request: NextRequest): boolean {
    if (request.headers.get('x-vercel-cron-schedule')) {
        return true;
    }

    const userAgent = request.headers.get('user-agent') ?? '';
    if (userAgent.startsWith('vercel-cron/')) {
        return true;
    }

    // Legacy header (older Vercel cron invocations)
    if (request.headers.get('x-vercel-cron')) {
        return true;
    }

    return false;
}

/**
 * Verifies cron requests via CRON_SECRET bearer token.
 * On Vercel, also accepts official cron request headers.
 */
export function verifyCronRequest(request: NextRequest): NextResponse | null {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (process.env.VERCEL === '1' && !isVercelCronRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return null;
}
