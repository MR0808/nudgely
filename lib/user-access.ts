import type { CompanyStatus, UserStatus } from '@/generated/prisma/client';

/** Fields needed to decide if a user may sign in or keep a session. */
export type UserAccessFields = {
    status?: UserStatus | null;
    banned?: boolean | null;
    banExpires?: Date | null;
};

export function isBanExpired(banExpires: Date | null | undefined): boolean {
    return !!banExpires && banExpires.getTime() <= Date.now();
}

export function isUserAccessBlocked(user: UserAccessFields): boolean {
    if (user.banned && !isBanExpired(user.banExpires)) {
        return true;
    }

    if (user.status === 'BANNED') {
        return !isBanExpired(user.banExpires);
    }

    return user.status === 'DISABLED';
}

export function isCompanyAccessBlocked(
    status: CompanyStatus | null | undefined
): boolean {
    return status === 'BANNED' || status === 'DISABLED';
}
