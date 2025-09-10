import { Metadata } from 'next';

import AuthTemplate from '@/components/auth/AuthTemplate';
import LoginForm from '@/components/auth/LoginForm';
import { isLoggedIn } from '@/lib/authCheck';

export function generateMetadata(): Metadata {
    return {
        title: 'Invite',
        description: 'Nudgely Invite'
    };
}

const RegisterPage = async () => {
    await isLoggedIn();

    return (
        <AuthTemplate>
            <LoginForm />
        </AuthTemplate>
    );
};
export default RegisterPage;
