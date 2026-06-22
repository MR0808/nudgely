import { type NextRequest, NextResponse } from 'next/server';

/**
 * Verifies cron requests via CRON_SECRET bearer token.
 * In production on Vercel, also requires the x-vercel-cron header.
 */
export function verifyCronRequest(request: NextRequest): NextResponse | null {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
        process.env.VERCEL === '1' &&
        !request.headers.get('x-vercel-cron')
    ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return null;
}
