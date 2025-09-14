'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
    Crown,
    Users,
    MoreHorizontal,
    UserMinus,
    Settings,
    Mail,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { InviteMemberDialog } from './InviteMemberDialog';
// import { removeTeamMember, changeTeamMemberRole } from '@/actions/team';
import { TeamMainProps, TeamMember } from '@/types/team';

const TeamMain = ({ teamData, userRole }: TeamMainProps) => {
    const [members, setMembers] = useState<TeamMember[]>(
        teamData?.members || []
    );
    const [error, setError] = useState<string | null>(null);
    const [removingMember, setRemovingMember] = useState<string | null>(null);
    const [changingRole, setChangingRole] = useState<string | null>(null);
    const [showRemoveDialog, setShowRemoveDialog] = useState<{
        member: TeamMember;
    } | null>(null);

    if (!teamData) return null;

    const handleRemoveMember = async (member: TeamMember) => {
        // setRemovingMember(member.id);
        // try {
        //     console.log('[v0] Removing team member:', member.id);
        //     const result = await removeTeamMember(member.id);
        //     if (result.success) {
        //         // Remove member from local state
        //         setMembers((prev) => prev.filter((m) => m.id !== member.id));
        //         setShowRemoveDialog(null);
        //     } else {
        //         setError(result.error || 'Failed to remove team member');
        //     }
        // } catch (error) {
        //     console.error('Failed to remove team member:', error);
        //     setError('Failed to remove team member');
        // } finally {
        //     setRemovingMember(null);
        // }
    };

    const handleChangeRole = async (
        memberId: string,
        newRole: 'TEAM_ADMIN' | 'TEAM_MEMBER'
    ) => {
        // setChangingRole(memberId);
        // try {
        //     console.log('[v0] Changing member role:', { memberId, newRole });
        //     const result = await changeTeamMemberRole(memberId, newRole);
        //     if (result.success) {
        //         // Update member role in local state
        //         setMembers((prev) =>
        //             prev.map((member) =>
        //                 member.id === memberId
        //                     ? { ...member, role: newRole }
        //                     : member
        //             )
        //         );
        //     } else {
        //         setError(result.error || 'Failed to change member role');
        //     }
        // } catch (error) {
        //     console.error('Failed to change member role:', error);
        //     setError('Failed to change member role');
        // } finally {
        //     setChangingRole(null);
        // }
    };

    const canManageMembers = userRole === 'TEAM_ADMIN';

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Team Members
                            </CardTitle>
                            <CardDescription>
                                {members.length} member
                                {members.length !== 1 ? 's' : ''} in{' '}
                                {teamData.team.name}
                            </CardDescription>
                        </div>
                        {canManageMembers && (
                            <InviteMemberDialog
                                teamId={teamData.team.id}
                                teamName={teamData.team.name}
                                companyPlan={teamData.team.company.plan.name}
                                currentMemberCount={members.length}
                            />
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-4">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage
                                            src={
                                                member.avatar ||
                                                '/placeholder.svg'
                                            }
                                            alt={member.name}
                                        />
                                        <AvatarFallback>
                                            {member.name
                                                .split(' ')
                                                .map((n) => n[0])
                                                .join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                {member.name}
                                            </span>
                                            {member.isCurrentUser && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    You
                                                </Badge>
                                            )}
                                            {member.role === 'TEAM_ADMIN' && (
                                                <Crown className="h-4 w-4 text-amber-500" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mail className="h-3 w-3" />
                                            {member.email}
                                            <span>•</span>
                                            <span>
                                                Joined{' '}
                                                {new Date(
                                                    member.joinedAt
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={
                                            member.role === 'TEAM_ADMIN'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {member.role === 'TEAM_ADMIN'
                                            ? 'Admin'
                                            : 'Member'}
                                    </Badge>

                                    {canManageMembers &&
                                        !member.isCurrentUser && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={
                                                            removingMember ===
                                                                member.id ||
                                                            changingRole ===
                                                                member.id
                                                        }
                                                    >
                                                        {removingMember ===
                                                            member.id ||
                                                        changingRole ===
                                                            member.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleChangeRole(
                                                                member.id,
                                                                member.role ===
                                                                    'TEAM_ADMIN'
                                                                    ? 'TEAM_MEMBER'
                                                                    : 'TEAM_ADMIN'
                                                            )
                                                        }
                                                    >
                                                        <Settings className="h-4 w-4 mr-2" />
                                                        {member.role ===
                                                        'TEAM_ADMIN'
                                                            ? 'Make Member'
                                                            : 'Make Admin'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() =>
                                                            setShowRemoveDialog(
                                                                { member }
                                                            )
                                                        }
                                                    >
                                                        <UserMinus className="h-4 w-4 mr-2" />
                                                        Remove from Team
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                </div>
                            </div>
                        ))}

                        {members.length === 0 && !error && (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No team members found</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Remove Member Confirmation Dialog */}
            <AlertDialog
                open={!!showRemoveDialog}
                onOpenChange={() => setShowRemoveDialog(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove{' '}
                            <strong>{showRemoveDialog?.member.name}</strong>{' '}
                            from the team? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                showRemoveDialog &&
                                handleRemoveMember(showRemoveDialog.member)
                            }
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={!!removingMember}
                        >
                            {removingMember ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Removing...
                                </>
                            ) : (
                                'Remove Member'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default TeamMain;
