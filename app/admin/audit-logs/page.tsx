import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { authCheckAdmin } from '@/lib/authCheck';
import { AuditLogList } from '@/components/admin/audit-logs/AuditLogList';

export default async function AdminAuditLogsPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    await authCheckAdmin('/admin/audit-logs');
    const params = await searchParams;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Audit logs
                </h1>
                <p className="text-muted-foreground mt-2">
                    Platform activity including admin actions
                </p>
            </div>
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <AuditLogList searchParams={params} />
            </Suspense>
        </div>
    );
}
