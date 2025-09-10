import { Metadata } from 'next';

import AuthTemplate from '@/components/auth/AuthTemplate';
import LoginForm from '@/components/auth/LoginForm';
import { isLoggedIn } from '@/lib/authCheck';
import { ParamsToken } from '@/types/global';

export function generateMetadata(): Metadata {
    return {
        title: 'Invite',
        description: 'Nudgely Invite'
    };
}

const RegisterPage = async (props: { params: ParamsToken }) => {
    const { token } = await props.params;

    return (
        <AuthTemplate>
            <LoginForm />
        </AuthTemplate>
    );
};
export default RegisterPage;
