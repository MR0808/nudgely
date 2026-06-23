'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    isCompanyAccessBlocked,
    isUserAccessBlocked
} from '@/lib/user-access';

async function getSessionFromHeaders() {
    const headerList = await headers();
    return auth.api.getSession({ headers: headerList });
}

async function blockInactiveAccess(
    session: NonNullable<Awaited<ReturnType<typeof getSessionFromHeaders>>>
) {
    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { status: true, banned: true, banExpires: true }
    });

    if (dbUser && isUserAccessBlocked(dbUser)) {
        redirect('/auth/login?error=account_inactive');
    }

    if (session.company) {
        const company = await prisma.company.findUnique({
            where: { id: session.company.id },
            select: { status: true }
        });

        if (company && isCompanyAccessBlocked(company.status)) {
            redirect('/auth/login?error=company_inactive');
        }
    }
}

export const isLoggedIn = async () => {
    const session = await getSessionFromHeaders();

    if (session) {
        if (!session.user.emailVerified) throw redirect('/auth/verify-email');

        await blockInactiveAccess(session);

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

    await blockInactiveAccess(session);

    if (!session.userCompany || !session.company) {
        throw redirect('/onboarding');
    }

    return session as typeof session & {
        company: NonNullable<typeof session.company>;
        userCompany: NonNullable<typeof session.userCompany>;
    };
};

export const authCheckServer = async () => {
    const session = await getSessionFromHeaders();
    if (!session) return false;

    if (!session.user.emailVerified) return false;

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { status: true, banned: true, banExpires: true }
    });

    if (dbUser && isUserAccessBlocked(dbUser)) return false;

    if (session.company) {
        const company = await prisma.company.findUnique({
            where: { id: session.company.id },
            select: { status: true }
        });
        if (company && isCompanyAccessBlocked(company.status)) return false;
    }

    return session;
};

/** Session guard for server actions that require company context. */
export const authCheckServerWithCompany = async () => {
    const session = await authCheckServer();
    if (!session || !session.company || !session.userCompany) {
        return false;
    }
    return session as typeof session & {
        company: NonNullable<typeof session.company>;
        userCompany: NonNullable<typeof session.userCompany>;
    };
};

export const authCheckOnboarding = async () => {
    const session = await getSessionFromHeaders();

    if (!session) throw redirect('/auth/login');

    await blockInactiveAccess(session);

    if (session.company?.profileCompleted) throw redirect('/');

    if (!session.userCompany || session.userCompany.role !== 'COMPANY_ADMIN') {
        throw redirect('/');
    }

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

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { status: true, banned: true, banExpires: true, role: true }
    });

    if (dbUser && isUserAccessBlocked(dbUser)) {
        redirect('/auth/login?error=account_inactive');
    }

    if (dbUser?.role !== 'SITE_ADMIN') {
        throw redirect('/');
    }

    return session;
};
