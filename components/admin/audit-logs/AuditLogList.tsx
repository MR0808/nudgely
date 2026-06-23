import { getAdminAuditLogs } from '@/actions/admin/audit-logs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/admin/Pagination';

export async function AuditLogList({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const { logs, totalCount } = await getAdminAuditLogs(searchParams);
    const currentPage = parseInt((searchParams.page as string) || '1', 10);
    const pageSize = parseInt((searchParams.pageSize as string) || '50', 10);

    if (logs.length === 0) {
        return (
            <Card className="p-12 text-center">
                <p className="text-muted-foreground">No audit logs found</p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {logs.map((log) => (
                    <Card key={log.id} className="p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">
                                        {log.category}
                                    </Badge>
                                    <span className="text-sm font-medium">
                                        {log.action}
                                    </span>
                                </div>
                                {log.description && (
                                    <p className="text-sm mt-1">
                                        {log.description}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                    {log.user
                                        ? `${log.user.name} ${log.user.lastName} (${log.user.email})`
                                        : 'System'}
                                    {' · '}
                                    {new Date(log.createdAt).toLocaleString()}
                                    {log.ipAddress && ` · ${log.ipAddress}`}
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            <Pagination
                totalItems={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
            />
        </div>
    );
}
