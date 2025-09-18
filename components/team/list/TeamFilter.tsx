'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    Plus,
    Search,
    Crown,
    Calendar,
    MoreHorizontal,
    Settings,
    UserPlus,
    Trash2,
    Building2
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TeamFilterProps } from '@/types/team';

const TeamFilter = ({ teamsDb }: TeamFilterProps) => {
    const [teams, setTeams] = useState(teamsDb || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const filteredTeams = teams.teams.filter((team) =>
        team.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDeleteTeam = async (teamId: string, teamName: string) => {
        // const result = await deleteTeam(teamId);
        // if (result.success) {
        //     setTeams((prev) => prev.filter((t) => t.id !== teamId));
        //     toast({
        //         title: 'Team Deleted',
        //         description: `${teamName} has been deleted`
        //     });
        // } else {
        //     toast({
        //         title: 'Error',
        //         description: result.error || 'Failed to delete team',
        //         variant: 'destructive'
        //     });
        // }
    };

    return (
        <>
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search teams..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Teams Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeams.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                            {searchQuery ? 'No teams found' : 'No teams yet'}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {searchQuery
                                ? 'Try adjusting your search terms'
                                : 'Create your first team to get started'}
                        </p>
                        {!searchQuery && (
                            <Link href="/team/create">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Team
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    filteredTeams.map((team) => (
                        <Card
                            key={team.id}
                            className="hover:shadow-md transition-shadow"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg">
                                            {team.name}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {team.description ? (
                                                team.description
                                            ) : (
                                                <>&nbsp;</>
                                            )}
                                        </CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                className="text-destructive cursor-pointer"
                                                onClick={() =>
                                                    handleDeleteTeam(
                                                        team.id,
                                                        team.name
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete Team
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-4">
                                    {/* Team Stats */}
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            {team.members.length} members
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Crown className="h-4 w-4" />
                                            {team.admins} admins
                                        </div>
                                    </div>

                                    {/* Member Avatars */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2">
                                            {team.members
                                                .slice(0, 4)
                                                .map((member) => (
                                                    <Avatar
                                                        key={member.id}
                                                        className="h-8 w-8 border-2 border-background"
                                                    >
                                                        <AvatarImage
                                                            src={
                                                                member.user
                                                                    .image ||
                                                                '/images/assets/profile.jpg'
                                                            }
                                                            alt={`${member.user.name} ${member.user.lastName}`}
                                                        />
                                                        <AvatarFallback className="text-xs">
                                                            {`${member.user.name[0]} ${member.user.lastName[0]}`}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                ))}
                                            {team.members.length > 4 && (
                                                <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                                                    +{team.members.length - 4}
                                                </div>
                                            )}
                                        </div>
                                        <Badge
                                            variant={team.company.plan.colour}
                                            className="text-xs"
                                        >
                                            {team.company.plan.name}
                                        </Badge>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            asChild
                                            size="sm"
                                            className="flex-1"
                                        >
                                            <Link href={`/team/${team.slug}`}>
                                                <Settings className="h-4 w-4 mr-2" />
                                                Manage
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 bg-transparent"
                                        >
                                            <Link
                                                href={`/team/${team.slug}/members`}
                                            >
                                                <Users className="h-4 w-4 mr-2" />
                                                Members
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </>
    );
};
export default TeamFilter;
