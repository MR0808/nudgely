import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side Sentry smoke test. Protected by CRON_SECRET (same bearer as cron jobs).
 *
 * curl -H "Authorization: Bearer $CRON_SECRET" https://app.nudgelyapp.com/api/sentry-test
 */
export async function GET(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const error = new Error('Nudgely Sentry server test');
    Sentry.captureException(error);
    await Sentry.flush(2000);

    return NextResponse.json({
        ok: true,
        message: 'Test error sent to Sentry. Check Issues in ~1 minute.'
    });
}
