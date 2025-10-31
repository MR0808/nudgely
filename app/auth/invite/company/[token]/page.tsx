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
import { getCompanyInvitationByToken } from '@/actions/invitation';
import CompanyInvitationForm from '@/components/auth/CompanyInvitationForm';

export function generateMetadata(): Metadata {
    return {
        title: 'Invite',
        description: 'Nudgely Invite'
    };
}

const RegisterCompanyAdminPage = async (props: { params: Promise<ParamsToken> }) => {
    await isLoggedIn();

    const { token } = await props.params;
    const invitation = await getCompanyInvitationByToken(token);

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
                <CompanyInvitationForm
                    invite={invitation.invitation}
                    inviter={invitation.inviter}
                />
            )}
        </AuthTemplate>
    );
};
export default RegisterCompanyAdminPage;
