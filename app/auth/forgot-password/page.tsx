import { Metadata } from 'next';

import AuthTemplate from '@/components/auth/AuthTemplate';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { isLoggedIn } from '@/lib/authCheck';

export function generateMetadata(): Metadata {
    return {
        title: 'Forgot Password',
        description: 'Nudgely Forgot Password'
    };
}

const ForgotPasswordPage = async () => {
    await isLoggedIn();

    return (
        <AuthTemplate>
            <ForgotPasswordForm />
        </AuthTemplate>
    );
};

export default ForgotPasswordPage;
