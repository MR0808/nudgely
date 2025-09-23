'use client';

import { Users, Plus, Crown, Settings } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import DeleteTeamDialog from '@/components/team/view/DeleteTeamDialog';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TeamsListProps } from '@/types/team';

const TeamsList = ({
    teams,
    searchQueryTeams,
    canManageCompany,
    setTeams
}: TeamsListProps) => {
    const [filteredTeams, setFilteredTeams] = useState(
        teams.filter((team) =>
            team.name.toLowerCase().includes(searchQueryTeams.toLowerCase())
        )
    );

    useEffect(() => {
        const newFilteredTeams = teams.filter((team) =>
            team.name.toLowerCase().includes(searchQueryTeams.toLowerCase())
        );

        setFilteredTeams(newFilteredTeams);
    }, [teams, searchQueryTeams]);

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.length === 0 ? (
                <div className="col-span-full text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                        {searchQueryTeams ? 'No teams found' : 'No teams yet'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        {searchQueryTeams
                            ? 'Try adjusting your search terms'
                            : 'Create your first team to get started'}
                    </p>
                    {!searchQueryTeams && (
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
                                {canManageCompany && (
                                    <DeleteTeamDialog
                                        teamId={team.id}
                                        setTeams={setTeams}
                                    />
                                )}
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
                                                            member.user.image ||
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
    );
};
export default TeamsList;
