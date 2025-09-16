import { Metadata } from 'next';
import {
    CheckCircle,
    XCircle,
    Clock,
    Building2,
    Users,
    Crown,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import AuthTemplate from '@/components/auth/AuthTemplate';
import { isLoggedIn } from '@/lib/authCheck';
import { ParamsToken } from '@/types/global';
import { getTeamInvitationByToken } from '@/actions/invitation';
import TeamInvitationForm from '@/components/auth/TeamInvitationForm';

export function generateMetadata(): Metadata {
    return {
        title: 'Invite',
        description: 'Nudgely Invite'
    };
}

const RegisterTeamPage = async (props: { params: ParamsToken }) => {
    await isLoggedIn();

    const { token } = await props.params;
    const invitation = await getTeamInvitationByToken(token);

    return (
        <AuthTemplate>
            {!invitation ||
                (invitation.error && (
                    <div className="bg-background flex items-center justify-center">
                        <Card className="w-full max-w-md">
                            <CardContent className="pt-6 text-center">
                                <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                                <h2 className="text-xl font-semibold mb-2">
                                    {invitation.error === 'expired'
                                        ? 'Invitation Expired'
                                        : 'Invalid Invitation'}
                                </h2>
                                <p className="text-muted-foreground mb-4">
                                    This invitation link has expired or is
                                    invalid.
                                </p>
                                <Link href="/">
                                    <Button className="cursor-pointer">
                                        Go to Nudgely
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                ))}
            {invitation && invitation.invitation && (
                <TeamInvitationForm
                    invite={invitation.invitation}
                    inviter={invitation.inviter}
                />
            )}
        </AuthTemplate>
    );
};
export default RegisterTeamPage;
