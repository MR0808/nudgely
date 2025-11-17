import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';

export const isLoggedIn = async () => {
    const headerList = await headers();

    const session = await auth.api.getSession({
        headers: headerList
    });

    if (session) {
        if (!session.user.emailVerified) return redirect('/auth/verify-email');

        // if (!session.user.phoneVerified) return redirect('/auth/verify-phone');

        return redirect('/');
    }
};

export const authCheck = async (callbackUrl?: string) => {
    const headerList = await headers();

    const session = await auth.api.getSession({
        headers: headerList
    });

    if (!session) {
        if (callbackUrl) {
            return redirect(
                `/auth/login?callbackURL=${encodeURIComponent(callbackUrl)}`
            );
        } else {
            return redirect('/auth/login');
        }
    }

    if (!session.user.emailVerified) return redirect('/auth/verify-email');

    if (
        session.company.creatorId === session.user.id &&
        !session.company.profileCompleted
    )
        return redirect('/onboarding');

    // if (!session.user.phoneVerified) return redirect('/auth/verify-phone');

    return session;
};

export const authCheckServer = async () => {
    const headerList = await headers();

    const session = await auth.api.getSession({
        headers: headerList
    });

    if (!session) return false;

    return session;
};

export const authCheckOnboarding = async () => {
    const headerList = await headers();

    const session = await auth.api.getSession({
        headers: headerList
    });

    if (!session) return redirect('/auth/login');

    if (session.company.profileCompleted) return redirect('/');

    if (session.company.creatorId !== session.user.id) return redirect('/');

    return session;
};

export const authCheckAdmin = async (callbackUrl?: string) => {
    const headerList = await headers();

    const session = await auth.api.getSession({
        headers: headerList
    });

    if (!session) {
        if (callbackUrl) {
            return redirect(
                `/auth/login?callbackURL=${encodeURIComponent(callbackUrl)}`
            );
        } else {
            return redirect('/auth/login');
        }
    }

    console.log(session.user.role);

    if (session.user.role !== 'SITE_ADMIN') {
        return redirect('/');
    }

    return session;
};
