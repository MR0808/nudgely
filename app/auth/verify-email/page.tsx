import { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';

import EmailVerificationForm from '@/components/auth/EmailVerificationForm';
import AuthTemplate from '@/components/auth/AuthTemplate';
import { resendEmailOTP } from '@/actions/verify-email';

export function generateMetadata(): Metadata {
    return {
        title: 'Email Verification',
        description: 'Nudgely Verification'
    };
}

const VerifyEmailPage = async () => {
    const headerList = await headers();

    const session = await auth.api.getSession({
        headers: headerList
    });

    if (!session) {
        return redirect('/auth/login');
    }

    if (session && session.user.emailVerified) {
        return redirect('/');
    }

    await resendEmailOTP(session.user.id);

    return (
        <AuthTemplate>
            <EmailVerificationForm
                email={session.user.email}
                userId={session.user.id}
            />
        </AuthTemplate>
    );
};

export default VerifyEmailPage;
