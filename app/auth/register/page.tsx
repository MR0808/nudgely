import { Metadata } from 'next';

import AuthTemplate from '@/components/auth/AuthTemplate';
import RegisterForm from '@/components/auth/registration/RegisterForm';
import { isLoggedIn } from '@/lib/authCheck';

export function generateMetadata(): Metadata {
    return {
        title: 'Register',
        description: 'Nudgely Registration'
    };
}

const RegisterPage = async () => {
    await isLoggedIn();

    return (
        <AuthTemplate>
            <RegisterForm />
        </AuthTemplate>
    );
};
export default RegisterPage;
