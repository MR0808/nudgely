'use server';

import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isUserAccessBlocked } from '@/lib/user-access';

export async function requireSiteAdmin() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== 'SITE_ADMIN') {
        throw new Error('Not authorised');
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { status: true, banned: true, banExpires: true, role: true }
    });

    if (!dbUser || isUserAccessBlocked(dbUser)) {
        throw new Error('Not authorised');
    }

    if (dbUser.role !== 'SITE_ADMIN') {
        throw new Error('Not authorised');
    }

    return session;
}
