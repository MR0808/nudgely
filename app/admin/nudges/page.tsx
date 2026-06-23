import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { authCheckAdmin } from '@/lib/authCheck';
import { NudgeList } from '@/components/admin/nudges/NudgeList';

export default async function AdminNudgesPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    await authCheckAdmin('/admin/nudges');
    const params = await searchParams;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nudges</h1>
                <p className="text-muted-foreground mt-2">
                    Platform-wide nudge overview
                </p>
            </div>
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <NudgeList searchParams={params} />
            </Suspense>
        </div>
    );
}
