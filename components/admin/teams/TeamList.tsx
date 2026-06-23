import { getTeams } from '@/actions/admin/teams';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/admin/Pagination';

export async function TeamList({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const { teams, totalCount } = await getTeams(searchParams);
    const currentPage = parseInt((searchParams.page as string) || '1', 10);
    const pageSize = parseInt((searchParams.pageSize as string) || '20', 10);

    if (teams.length === 0) {
        return (
            <Card className="p-12 text-center">
                <p className="text-muted-foreground">No teams found</p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {teams.map((team) => (
                    <Card key={team.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="font-semibold">{team.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {team.company.name}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {team._count.members} members ·{' '}
                                    {team._count.nudges} nudges
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Badge
                                    variant={
                                        team.status === 'ACTIVE'
                                            ? 'outline'
                                            : 'secondary'
                                    }
                                >
                                    {team.status}
                                </Badge>
                                {team.isFrozen && (
                                    <Badge variant="destructive">Frozen</Badge>
                                )}
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
