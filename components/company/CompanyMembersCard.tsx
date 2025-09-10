'use client';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

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
import { Users, Crown, MoreHorizontal, Mail, Loader2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import InviteCompanyMemberDialog from '@/components/company/InviteCompanyMemberDialog';
import {
    removeCompanyMember,
    changeCompanyMemberRole,
    resendCompanyInvitation
} from '@/actions/companyMembers';
import { CompanyMembersCardProps } from '@/types/company';
import CancelInviteDialog from '@/components/company/CancelInviteDialog';

const CompanyMembersCard = ({
    company,
    membersData,
    invitesData
}: CompanyMembersCardProps) => {
    const [isPendingResend, startTransitionResend] = useTransition();
    const [members, setMembers] = useState(membersData);
    const [pendingInvites, setPendingInvites] = useState(invitesData);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [inviteId, setInviteId] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleRemoveMember = async (memberId: string) => {
        const result = await removeCompanyMember(memberId);
        if (result.success) {
            setMembers((prev) => prev.filter((m) => m.id !== memberId));
        }
    };

    const handleChangeRole = async (
        memberId: string,
        newRole: 'COMPANY_ADMIN' | 'COMPANY_MEMBER'
    ) => {
        const result = await changeCompanyMemberRole(memberId, newRole);
        if (result.success) {
            setMembers((prev) =>
                prev.map((m) =>
                    m.id === memberId ? { ...m, role: newRole } : m
                )
            );
        }
    };

    const handleCancelInvite = async (
        inviteId: string,
        name: string,
        email: string
    ) => {
        setInviteId(inviteId);
        setName(name);
        setEmail(email);
        setCancelDialogOpen(true);
    };

    const handleResendInvite = async (inviteId: string) => {
        startTransitionResend(async () => {
            const data = await resendCompanyInvitation(inviteId);
            if (data.error) {
                toast.error(data.error);
            }
            if (data.data) {
                toast.success('User invite resent');
            }
        });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Company Admins
                        <Badge variant="secondary">{members.length}</Badge>
                    </CardTitle>
                    <CardDescription>Manage company admins.</CardDescription>
                </div>
                {company.plan !== 'FREE' && (
                    <InviteCompanyMemberDialog
                        companyId={company.id}
                        companyName={company.name}
                        companyPlan={company.plan}
                        currentMemberCount={members.length}
                        setMembers={setMembers}
                        setPendingInvites={setPendingInvites}
                    />
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Active Members */}
                <div className="space-y-3">
                    {members.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage
                                            src={member.user.image || ''}
                                            alt={`${member.user.name} ${member.user.lastName}`}
                                        />
                                        <AvatarFallback>
                                            {`${member.user.name[0]} ${member.user.lastName[0]}`}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium">
                                            {`${member.user.name} ${member.user.lastName}`}
                                        </p>
                                        {company.creatorId ===
                                            member.user.id && (
                                            <Crown className="h-3 w-3 text-amber-500" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {member.user.email}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={
                                        member.role === 'COMPANY_ADMIN'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                    className="text-xs"
                                >
                                    {member.role === 'COMPANY_ADMIN'
                                        ? 'Admin'
                                        : 'Member'}
                                </Badge>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {company.creatorId !==
                                            member.user.id && (
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    handleChangeRole(
                                                        member.id,
                                                        member.role ===
                                                            'COMPANY_ADMIN'
                                                            ? 'COMPANY_MEMBER'
                                                            : 'COMPANY_ADMIN'
                                                    )
                                                }
                                            >
                                                {member.role === 'COMPANY_ADMIN'
                                                    ? 'Remove Admin'
                                                    : 'Make Admin'}
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem>
                                            View Profile
                                        </DropdownMenuItem>
                                        {member.user.status !== 'ACTIVE' && (
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() =>
                                                    handleRemoveMember(
                                                        member.id
                                                    )
                                                }
                                            >
                                                Remove Member
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pending Invites */}
                {pendingInvites.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            Pending Invites
                        </div>
                        {pendingInvites.map((invite) => (
                            <div
                                key={invite.id}
                                className="flex items-center justify-between p-3 border rounded-lg border-dashed"
                            >
                                <div>
                                    <p className="text-sm font-medium">
                                        {`${invite.name} - ${invite.email}`}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Invited{' '}
                                        {invite.createdAt.toLocaleDateString()}{' '}
                                        • Expires{' '}
                                        {invite.expiresAt.toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        Pending
                                    </Badge>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={isPendingResend}
                                            >
                                                {isPendingResend ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <MoreHorizontal className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    handleResendInvite(
                                                        invite.id
                                                    )
                                                }
                                            >
                                                Resend Invite
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() =>
                                                    handleCancelInvite(
                                                        invite.id,
                                                        invite.name,
                                                        invite.email
                                                    )
                                                }
                                            >
                                                Cancel Invite
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                        <CancelInviteDialog
                            name={name}
                            email={email}
                            inviteId={inviteId}
                            setPendingInvites={setPendingInvites}
                            open={cancelDialogOpen}
                            onOpenChange={setCancelDialogOpen}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default CompanyMembersCard;
