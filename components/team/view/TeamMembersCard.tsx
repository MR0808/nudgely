'use client';

import { Users, Crown, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TeamMembersCardProps } from '@/types/team';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InviteMemberDialog } from '@/components/team/view/InviteMemberDialog';

const TeamMembersCard = ({
    canManageTeam,
    membersData,
    team
}: TeamMembersCardProps) => {
    const [members, setMembers] = useState(membersData);
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Members
                    </CardTitle>
                    <CardDescription>{members.length} members</CardDescription>
                </div>
                {/* {canManageTeam && (
                    <Link href={`/team/${team.slug}/members`}>
                        <Button size="sm" variant="outline">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Invite
                        </Button>
                    </Link>
                )} */}
                {canManageTeam && (
                    <InviteMemberDialog
                        teamId={team.id}
                        teamName={team.name}
                        companyPlan={team.company.plan}
                        currentMemberCount={members.length}
                        setMembers={setMembers}
                        trigger="team"
                    />
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {members.slice(0, 5).map((member: any) => (
                        <div
                            key={member.id}
                            className="flex items-center gap-3"
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarImage
                                    src={member.avatar || '/placeholder.svg'}
                                    alt={member.name}
                                />
                                <AvatarFallback className="text-xs">
                                    {member.name
                                        .split(' ')
                                        .map((n: string) => n[0])
                                        .join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium truncate">
                                        {member.name}
                                    </p>
                                    {member.role === 'TEAM_ADMIN' && (
                                        <Crown className="h-3 w-3 text-amber-500" />
                                    )}
                                    {member.isCurrentUser && (
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            You
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                    {member.email}
                                </p>
                            </div>
                        </div>
                    ))}
                    {members.length > 5 && (
                        <div className="text-center pt-2">
                            <Link href={`/team/${team.slug}/members`}>
                                <Button variant="ghost" size="sm">
                                    View all {members.length} members
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
export default TeamMembersCard;
