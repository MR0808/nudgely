'use server';

import {
    logCompanyAcceptInvite,
    logCompanyDeclineInvite
} from '@/actions/audit/audit-invite';
import { prisma } from '@/lib/prisma';

export const getCompanyInvitationByToken = async (token: string) => {
    try {
        const invitation = await prisma.companyInvite.findUnique({
            where: { token },
            include: { company: { include: { members: true } } }
        });

        if (!invitation) {
            return {
                success: false,
                invitation: null,
                inviter: null,
                error: 'notfound'
            };
        }

        if (invitation.status !== 'PENDING') {
            return {
                success: false,
                invitation: null,
                inviter: null,
                error: 'processed'
            };
        }

        if (new Date() > invitation.expiresAt) {
            // Mark as expired
            await prisma.teamInvite.update({
                where: { id: invitation.id },
                data: { status: 'EXPIRED' }
            });
            return {
                success: false,
                invitation: null,
                inviter: null,
                error: 'expired'
            };
        }

        // Get inviter information
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
                invitation: null,
                inviter: null,
                error: 'inviter'
            };
        }

        return {
            success: true,
            invitation,
            inviter,
            error: null
        };
    } catch (error) {
        console.error('Failed to get invitation:', error);
        return {
            success: false,
            invitation: null,
            inviter: null,
            error: 'Failed to load invitation'
        };
    }
};

export const acceptTeamInvitation = async (token: string) => {
    try {
        const invitation = await prisma.companyInvite.findUnique({
            where: { token },
            include: {
                company: true
            }
        });

        if (!invitation) {
            return { success: false, error: 'Invitation not found' };
        }

        if (invitation.status !== 'PENDING') {
            return {
                success: false,
                error: 'Invitation has already been processed'
            };
        }

        if (new Date() > invitation.expiresAt) {
            return { success: false, error: 'Invitation has expired' };
        }

        // Check if user is already a team member
        const existingMember = await prisma.user.findUnique({
            where: {
                email: invitation.email
            }
        });

        if (existingMember) {
            return { success: false, error: 'User already exists' };
        }

        await logCompanyAcceptInvite({
            invitationId: invitation.id,
            acceptedEmail: invitation.email,
            companyId: invitation.companyId,
            companyName: invitation.company.name
        });

        return {
            success: true,
            error: null
        };
    } catch (error) {
        console.error('Failed to accept invitation:', error);
        return { success: false, error: 'Failed to accept invitation' };
    }
};

export const declineCompanyInvitation = async (token: string) => {
    try {
        const invitation = await prisma.companyInvite.findUnique({
            where: { token },
            include: {
                company: true
            }
        });

        if (!invitation) {
            return { success: false, error: 'Invitation not found' };
        }

        if (invitation.status !== 'PENDING') {
            return {
                success: false,
                error: 'Invitation has already been processed'
            };
        }

        // Mark invitation as declined
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

        return {
            success: true,
            erro: null
        };
    } catch (error) {
        console.error('Failed to decline invitation:', error);
        return { success: false, error: 'Failed to decline invitation' };
    }
};
