import { createAuthClient } from 'better-auth/react';
import {
    inferAdditionalFields,
    adminClient,
    customSessionClient
} from 'better-auth/client/plugins';
import type { auth } from '@/lib/auth';
import { ac, roles } from '@/lib/permissions';

function getBaseUrl(): string {
    if (typeof window !== 'undefined') return window.location.origin;
    return process.env.NEXT_PUBLIC_APP_URL ?? '';
}

export const authClient = createAuthClient({
    baseURL: getBaseUrl(),
    plugins: [
        inferAdditionalFields<typeof auth>(),
        adminClient({ ac, roles }),
        customSessionClient<typeof auth>()
    ]
});

export const {
    signUp,
    signOut,
    signIn,
    useSession,
    admin,
    sendVerificationEmail,
    requestPasswordReset,
    resetPassword,
    updateUser,
    changeEmail,
    changePassword
} = authClient;
