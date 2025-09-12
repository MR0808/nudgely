import Link from 'next/link';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Building2,
    Plus,
    Users,
    CheckSquare,
    Pause,
    MoreHorizontal
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { CompanyTeamsCardProps } from '@/types/company';

const CompanyTeamsCard = ({ teams, userSession }: CompanyTeamsCardProps) => {
    const activeTeams = teams.filter((t) => !t.isFrozen);
    const frozenTeams = teams.filter((t) => t.isFrozen);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Teams
                        <Badge variant="secondary">{teams.length}</Badge>
                    </CardTitle>
                    <CardDescription>
                        Manage teams within your company
                    </CardDescription>
                </div>
                <Link href="/team/create">
                    <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Team
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Active Teams */}
                <div className="space-y-3">
                    {activeTeams.map((team) => (
                        <div
                            key={team.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                        {team.name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium">
                                            {team.name}
                                        </p>
                                        <Badge
                                            variant="default"
                                            className="text-xs"
                                        >
                                            Active
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {team.description}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {team.members.length}
                                        </div>
                                        {/* <div className="flex items-center gap-1">
                                            <CheckSquare className="h-3 w-3" />
                                            {team.completedTasks}/
                                            {team.taskCount}
                                        </div> */}
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            View Team
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            Edit Team
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            Manage Members
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive">
                                            Delete Team
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Frozen Teams */}
                {frozenTeams.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Pause className="h-4 w-4" />
                            Frozen Teams
                        </div>
                        {frozenTeams.map((team) => (
                            <div
                                key={team.id}
                                className="flex items-center justify-between p-3 border rounded-lg border-dashed opacity-60"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                            {team.name
                                                .split(' ')
                                                .map((n) => n[0])
                                                .join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium">
                                                {team.name}
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                Frozen
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Upgrade to Pro to reactivate
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-xs text-muted-foreground">
                                        {team.members.length} members
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled
                                    >
                                        Frozen
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default CompanyTeamsCard;
