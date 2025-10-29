import { redirect } from 'next/navigation';
import { Metadata } from 'next';

import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import AuthTemplate from '@/components/auth/AuthTemplate';
import { isLoggedIn } from '@/lib/authCheck';

export function generateMetadata(): Metadata {
    return {
        title: 'New Password',
        description: 'Nudgely New Password'
    };
}

const ResetPasswordPage = async ({
    searchParams
}: {
    searchParams: Promise<{ token: string }>;
}) => {
    await isLoggedIn();

    const token = (await searchParams).token;

    if (!token) redirect('/auth/login');
    return (
        <AuthTemplate>
            <ResetPasswordForm token={token} />
        </AuthTemplate>
    );
};

export default ResetPasswordPage;
