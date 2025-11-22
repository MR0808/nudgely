'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';

async function getSessionFromHeaders() {
    const headerList = await headers();
    return auth.api.getSession({ headers: headerList });
}

export const isLoggedIn = async () => {
    const session = await getSessionFromHeaders();

    if (session) {
        if (!session.user.emailVerified) throw redirect('/auth/verify-email');

        // if (!session.user.phoneVerified) return redirect('/auth/verify-phone');

        throw redirect('/');
    }

    return null;
};

export const authCheck = async (callbackUrl?: string) => {
    const session = await getSessionFromHeaders();

    if (!session) {
        const url = callbackUrl
            ? `/auth/login?callbackURL=${encodeURIComponent(callbackUrl)}`
            : `/auth/login`;

        throw redirect(url);
    }

    if (!session.user.emailVerified) throw redirect('/auth/verify-email');

    return session;
};

export const authCheckServer = async () => {
    const session = await getSessionFromHeaders();
    return session ?? false;
};

export const authCheckOnboarding = async () => {
    const session = await getSessionFromHeaders();

    if (!session) throw redirect('/auth/login');

    if (session.company.profileCompleted) throw redirect('/');

    if (session.userCompany.role !== 'COMPANY_ADMIN') throw redirect('/');

    return session;
};

export const authCheckAdmin = async (callbackUrl?: string) => {
    const session = await getSessionFromHeaders();
    if (!session) {
        const url = callbackUrl
            ? `/auth/login?callbackURL=${encodeURIComponent(callbackUrl)}`
            : `/auth/login`;

        throw redirect(url);
    }

    if (session.user.role !== 'SITE_ADMIN') {
        throw redirect('/');
    }

    return session;
};
