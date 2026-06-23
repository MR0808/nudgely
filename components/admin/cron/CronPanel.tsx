'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { triggerSendNudgesCron } from '@/actions/admin/cron';
import type { SendNudgesJobResults } from '@/lib/cron/send-nudges-job';

type CronStats = {
    activeNudges: number;
    pendingInstances: number;
    failedInstances: number;
    eventsSentLast24h: number;
    lastAdminCronRun: {
        createdAt: Date;
        description: string | null;
        metadata: unknown;
    } | null;
};

export function CronPanel({ stats }: { stats: CronStats }) {
    const [loading, setLoading] = useState(false);
    const [lastResult, setLastResult] = useState<SendNudgesJobResults | null>(
        null
    );

    const handleRun = async () => {
        setLoading(true);
        try {
            const result = await triggerSendNudgesCron();
            setLastResult(result.results);
            toast.success('Send-nudges job completed');
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'Cron job failed'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Active nudges</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">
                            {stats.activeNudges}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                            Pending instances
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">
                            {stats.pendingInstances}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                            Failed instances
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">
                            {stats.failedInstances}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Sent (24h)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">
                            {stats.eventsSentLast24h}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>send-nudges</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Processes active nudges and sends reminder emails.
                        Scheduled via Vercel cron in production. You can run it
                        manually here for testing or catch-up.
                    </p>
                    {stats.lastAdminCronRun && (
                        <p className="text-sm text-muted-foreground">
                            Last manual run:{' '}
                            {new Date(
                                stats.lastAdminCronRun.createdAt
                            ).toLocaleString()}
                        </p>
                    )}
                    <Button onClick={handleRun} disabled={loading}>
                        <Play className="h-4 w-4 mr-2" />
                        {loading ? 'Running…' : 'Run now'}
                    </Button>
                    {lastResult && (
                        <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto">
                            {JSON.stringify(lastResult, null, 2)}
                        </pre>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
