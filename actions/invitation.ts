'use server';

import {
    logCompanyAcceptInvite,
    logCompanyDeclineInvite,
    logTeamAcceptInvite,
    logTeamDeclineInvite
} from '@/actions/audit/audit-invite';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';

/* --------------------------------------------------------------------------
 *  TYPES — COMPLETE & ACCURATE (NO "any")
 * -------------------------------------------------------------------------- */

export type CompanyInviteFull = Prisma.CompanyInviteGetPayload<{
    include: {
        company: {
            include: {
                plan: true;
                members: true;
            };
        };
    };
}>;

export type TeamInviteFull = Prisma.TeamInviteGetPayload<{
    include: {
        team: {
            include: {
                company: { include: { plan: true; members: true } };
                members: true;
            };
        };
    };
}>;

export type Inviter = {
    name: string | null;
    lastName: string | null;
    email: string;
    image: string | null;
};

export type InvitationResult<T> = {
    success: boolean;
    error: string | null;
    invitation: T | null;
    inviter: Inviter | null;
};

/* ========================================================================== */
/*                    COMPANY — GET INVITATION BY TOKEN                       */
/* ========================================================================== */

export const getCompanyInvitationByToken = async (
    token: string
): Promise<InvitationResult<CompanyInviteFull>> => {
    try {
        const invitation = await prisma.companyInvite.findUnique({
            where: { token },
            include: {
                company: {
                    include: {
                        plan: true,
                        members: true
                    }
                }
            }
        });

        if (!invitation) {
            return {
                success: false,
                error: 'notfound',
                invitation: null,
                inviter: null
            };
        }

        if (invitation.status !== 'PENDING') {
            return {
                success: false,
                error: 'processed',
                invitation: null,
                inviter: null
            };
        }

        if (new Date() > invitation.expiresAt) {
            await prisma.companyInvite.update({
                where: { id: invitation.id },
                data: { status: 'EXPIRED' }
            });

            return {
                success: false,
                error: 'expired',
                invitation: null,
                inviter: null
            };
        }

        const inviter = await prisma.user.findUnique({
            where: { id: invitation.invitedBy },
            select: {
                name: true,
                lastName: true,
                email: true,
                image: true
            }
        });

        if (!inviter) {
            return {
                success: false,
                error: 'inviter',
                invitation: null,
                inviter: null
            };
        }

        return {
            success: true,
            error: null,
            invitation,
            inviter
        };
    } catch (error) {
        console.error('Failed to get company invitation:', error);
        return {
            success: false,
            error: 'Failed to load invitation',
            invitation: null,
            inviter: null
        };
    }
};

/* ========================================================================== */
/*                          COMPANY — ACCEPT INVITE                           */
/* ========================================================================== */

export const acceptCompanyInvitation = async (
    token: string
): Promise<{ success: boolean; error: string | null }> => {
    try {
        const invitation = await prisma.companyInvite.findUnique({
            where: { token },
            include: { company: true }
        });

        if (!invitation) {
            return { success: false, error: 'Invitation not found' };
        }

        if (invitation.status !== 'PENDING') {
            return { success: false, error: 'Invitation already processed' };
        }

        if (new Date() > invitation.expiresAt) {
            return { success: false, error: 'Invitation expired' };
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: invitation.email }
        });

        if (existingUser) {
            return { success: false, error: 'User already exists' };
        }

        await logCompanyAcceptInvite({
            invitationId: invitation.id,
            acceptedEmail: invitation.email,
            companyId: invitation.companyId,
            companyName: invitation.company.name
        });

        return { success: true, error: null };
    } catch (error) {
        console.error('Failed to accept company invite:', error);
        return { success: false, error: 'Failed to accept invitation' };
    }
};

/* ========================================================================== */
/*                          COMPANY — DECLINE INVITE                          */
/* ========================================================================== */

export const declineCompanyInvitation = async (
    token: string
): Promise<{ success: boolean; error: string | null }> => {
    try {
        const invitation = await prisma.companyInvite.findUnique({
            where: { token },
            include: { company: true }
        });

        if (!invitation) {
            return { success: false, error: 'Invitation not found' };
        }

        if (invitation.status !== 'PENDING') {
            return { success: false, error: 'Invitation already processed' };
        }

        await prisma.companyInvite.update({
            where: { id: invitation.id },
            data: { status: 'DECLINED' }
        });

        await logCompanyDeclineInvite({
            invitationId: invitation.id,
            declinedEmail: invitation.email,
            companyId: invitation.companyId,
            companyName: invitation.company.name
        });

        return { success: true, error: null };
    } catch (error) {
        console.error('Failed to decline company invitation:', error);
        return { success: false, error: 'Failed to decline invitation' };
    }
};

/* ========================================================================== */
/*                     TEAM — GET INVITATION BY TOKEN                         */
/* ========================================================================== */

export const getTeamInvitationByToken = async (
    token: string
): Promise<InvitationResult<TeamInviteFull>> => {
    try {
        const invitation = await prisma.teamInvite.findUnique({
            where: { token },
            include: {
                team: {
                    include: {
                        company: { include: { plan: true, members: true } },
                        members: true
                    }
                }
            }
        });

        if (!invitation) {
            return {
                success: false,
                error: 'notfound',
                invitation: null,
                inviter: null
            };
        }

        if (invitation.status !== 'PENDING') {
            return {
                success: false,
                error: 'processed',
                invitation: null,
                inviter: null
            };
        }

        if (new Date() > invitation.expiresAt) {
            await prisma.teamInvite.update({
                where: { id: invitation.id },
                data: { status: 'EXPIRED' }
            });

            return {
                success: false,
                error: 'expired',
                invitation: null,
                inviter: null
            };
        }

        const inviter = await prisma.user.findUnique({
            where: { id: invitation.invitedBy },
            select: {
                name: true,
                lastName: true,
                email: true,
                image: true
            }
        });

        if (!inviter) {
            return {
                success: false,
                error: 'inviter',
                invitation: null,
                inviter: null
            };
        }

        return {
            success: true,
            error: null,
            invitation,
            inviter
        };
    } catch (error) {
        console.error('Failed to get team invitation:', error);
        return {
            success: false,
            error: 'Failed to load invitation',
            invitation: null,
            inviter: null
        };
    }
};

/* ========================================================================== */
/*                           TEAM — ACCEPT INVITE                             */
/* ========================================================================== */

export const acceptTeamInvitation = async (
    token: string
): Promise<{ success: boolean; error: string | null }> => {
    try {
        const invitation = await prisma.teamInvite.findUnique({
            where: { token },
            include: {
                team: {
                    include: {
                        company: { include: { plan: true, members: true } }
                    }
                }
            }
        });

        if (!invitation) {
            return { success: false, error: 'Invitation not found' };
        }

        if (invitation.status !== 'PENDING') {
            return { success: false, error: 'Invitation already processed' };
        }

        if (new Date() > invitation.expiresAt) {
            await prisma.teamInvite.update({
                where: { id: invitation.id },
                data: { status: 'EXPIRED' }
            });

            return { success: false, error: 'Invitation expired' };
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: invitation.email }
        });

        if (existingUser) {
            return { success: false, error: 'User already exists' };
        }

        await logTeamAcceptInvite({
            invitationId: invitation.id,
            acceptedEmail: invitation.email,
            teamId: invitation.teamId,
            teamName: invitation.team.name
        });

        return { success: true, error: null };
    } catch (error) {
        console.error('Failed to accept team invitation:', error);
        return { success: false, error: 'Failed to accept invitation' };
    }
};

/* ========================================================================== */
/*                           TEAM — DECLINE INVITE                            */
/* ========================================================================== */

export const declineTeamInvitation = async (
    token: string
): Promise<{ success: boolean; error: string | null }> => {
    try {
        const invitation = await prisma.teamInvite.findUnique({
            where: { token },
            include: {
                team: {
                    include: {
                        company: { include: { plan: true, members: true } }
                    }
                }
            }
        });

        if (!invitation) {
            return { success: false, error: 'Invitation not found' };
        }

        if (invitation.status !== 'PENDING') {
            return { success: false, error: 'Invitation already processed' };
        }

        await prisma.teamInvite.update({
            where: { id: invitation.id },
            data: { status: 'DECLINED' }
        });

        await logTeamDeclineInvite({
            invitationId: invitation.id,
            declinedEmail: invitation.email,
            teamId: invitation.teamId,
            teamName: invitation.team.name
        });

        return { success: true, error: null };
    } catch (error) {
        console.error('Failed to decline team invitation:', error);
        return { success: false, error: 'Failed to decline invitation' };
    }
};
