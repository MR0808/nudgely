'use client';

import { useState, useTransition } from 'react';
import { Building2, Users, Crown, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CompanyInvitationFormProps } from '@/types/invitation';
import Link from 'next/link';
import {
    acceptTeamInvitation,
    declineCompanyInvitation
} from '@/actions/invitation';
import CompanyUserRegistationForm from '@/components/auth/companyUserRegistration/CompanyUserRegistationForm';

const CompanyInvitationForm = ({
    invite,
    inviter
}: CompanyInvitationFormProps) => {
    const [status, setStatus] = useState<
        'pending' | 'valid' | 'expired' | 'accepted' | 'declined' | 'error'
    >('pending');
    const [isPendingDecline, startTransitionDecline] = useTransition();
    const [isPendingAccept, startTransitionAccept] = useTransition();

    const handleAccept = async () => {
        startTransitionAccept(async () => {
            const data = await acceptTeamInvitation(invite.token);
            if (data.error) {
                toast.error(data.error);
            }
            if (data.success) {
                setStatus('accepted');
            }
        });
    };

    const handleDecline = async () => {
        startTransitionDecline(async () => {
            const data = await declineCompanyInvitation(invite.token);
            if (data.error) {
                toast.error(data.error);
            }
            if (data.success) {
                setStatus('declined');
            }
        });
    };

    if (status === 'declined') {
        return (
            <div className="bg-background flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h2 className="text-xl font-semibold mb-2">
                            Invitation Declined
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            You&apos;ve declined the invitation to join{' '}
                            <strong>{invite.company.name}</strong>
                        </p>
                        <Link href="/">
                            <Button variant="outline">Go to Nudgely</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (status === 'accepted') {
        return (
            <CompanyUserRegistationForm
                companyId={invite.company.id}
                inviteId={invite.id}
                email={invite.email}
            />
        );
    }

    return (
        <div className="bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl">
                        You&apos;re Invited!
                    </CardTitle>
                    <CardDescription>
                        Join <strong>{invite.company.name}</strong> on Nudgely
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Team Info */}
                    <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">
                                {invite.company.name}
                            </h3>
                            <Badge
                                variant={
                                    invite.company.plan === 'GROWTH'
                                        ? 'default'
                                        : 'secondary'
                                }
                            >
                                {invite.company.plan}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {invite.company.name}
                            </div>
                            <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {invite.company.members.length} members
                            </div>
                        </div>
                    </div>

                    {/* Invited By */}
                    {inviter && (
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                            <Avatar className="h-10 w-10">
                                <AvatarImage
                                    src={
                                        inviter.image ||
                                        '/images/assets/profile.jpg'
                                    }
                                    alt={`${inviter.name} ${inviter.lastName}`}
                                />
                                <AvatarFallback>
                                    {`${inviter.name[0]} ${inviter.lastName[0]}`}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">
                                    Invited by{' '}
                                    {`${inviter.name} ${inviter.lastName}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {inviter.email}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Role */}
                    <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Crown className="h-4 w-4 text-amber-500" />

                            <Users className="h-4 w-4" />

                            <span className="font-medium">
                                Company Admin Role
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Full access to manage company settings, invite
                            members, and oversee all company nudges.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            onClick={handleDecline}
                            variant="outline"
                            className="flex-1 bg-transparent cursor-pointer"
                            disabled={isPendingDecline || isPendingAccept}
                        >
                            {isPendingDecline && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Decline
                        </Button>
                        <Button
                            onClick={handleAccept}
                            className="flex-1 cursor-pointer"
                            disabled={isPendingDecline || isPendingAccept}
                        >
                            {isPendingAccept ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Joining...
                                </>
                            ) : (
                                'Accept & Join'
                            )}
                        </Button>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                        This invitation expires on{' '}
                        {invite.expiresAt
                            ? new Date(invite.expiresAt).toLocaleDateString()
                            : ''}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
export default CompanyInvitationForm;
