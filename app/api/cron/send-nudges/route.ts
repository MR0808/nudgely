import { type NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cron-auth';
import { runSendNudgesJob } from '@/lib/cron/send-nudges-job';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
    const authError = verifyCronRequest(request);
    if (authError) return authError;

    try {
        const results = await runSendNudgesJob();
        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error('[cron:send-nudges] Cron job error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message:
                    error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
