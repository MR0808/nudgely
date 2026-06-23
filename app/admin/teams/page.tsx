import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { authCheckAdmin } from '@/lib/authCheck';
import { TeamList } from '@/components/admin/teams/TeamList';

export default async function AdminTeamsPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    await authCheckAdmin('/admin/teams');
    const params = await searchParams;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
                <p className="text-muted-foreground mt-2">
                    All teams across companies
                </p>
            </div>
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <TeamList searchParams={params} />
            </Suspense>
        </div>
    );
}
