import { getNudges } from '@/actions/admin/nudges';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/admin/Pagination';

export async function NudgeList({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const { nudges, totalCount } = await getNudges(searchParams);
    const currentPage = parseInt((searchParams.page as string) || '1', 10);
    const pageSize = parseInt((searchParams.pageSize as string) || '20', 10);

    if (nudges.length === 0) {
        return (
            <Card className="p-12 text-center">
                <p className="text-muted-foreground">No nudges found</p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {nudges.map((nudge) => (
                    <Card key={nudge.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="font-semibold">{nudge.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {nudge.team.company.name} ·{' '}
                                    {nudge.team.name}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {nudge.frequency} ·{' '}
                                    {nudge._count.recipients} recipients ·{' '}
                                    {nudge._count.instances} instances
                                </p>
                            </div>
                            <Badge
                                variant={
                                    nudge.status === 'ACTIVE'
                                        ? 'default'
                                        : nudge.status === 'PAUSED'
                                          ? 'secondary'
                                          : 'outline'
                                }
                            >
                                {nudge.status}
                            </Badge>
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
