'use server';

import * as z from 'zod';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';
import {
    sendCompanyAddedAdminEmail,
    sendCompanyInviteAdminEmail
} from '@/lib/mail';
import { InviteCompanyAdminSchema } from '@/schemas/companyMember';
import {
    logCompanyAdminAdded,
    logCompanyAdminInvited
} from '@/actions/audit/audit-company';

export const inviteCompanyAdmin = async (
    values: z.infer<typeof InviteCompanyAdminSchema>,
    companyId: string
) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            data: null,
            message: 'Not authorised'
        };
    }

    const { user, company, userCompany } = userSession;

    if (userCompany.role !== 'COMPANY_ADMIN') {
        return {
            data: null,
            message: 'Not authorised'
        };
    }

    try {
        // Validate input
        const validatedFields = InviteCompanyAdminSchema.safeParse(values);

        if (!validatedFields.success) {
            return {
                data: null,
                message: 'Invalid fields'
            };
        }

        const existingMember = await prisma.user.findUnique({
            where: { email: values.email }
        });

        if (existingMember) {
            const companyMember = await prisma.companyMember.findFirst({
                where: { userId: existingMember.id }
            });

            if (!companyMember)
                return {
                    success: false,
                    error: 'Error in adding user, please contact support - Error 1021'
                };

            if (companyMember.companyId !== companyId)
                return {
                    success: false,
                    error: 'User belongs to a different company, unable to add them'
                };

            if (companyMember.role === 'COMPANY_ADMIN')
                return {
                    success: false,
                    error: 'This user is already a company admin'
                };

            const updateAdmin = await prisma.companyMember.update({
                where: { id: companyMember.id },
                data: { role: 'COMPANY_ADMIN' }
            });

            if (!updateAdmin)
                return {
                    success: false,
                    error: 'Error in adding user, please contact support - Error 1022'
                };

            const updateTeams = await prisma.teamMember.updateMany({
                where: { team: { companyId }, userId: user.id },
                data: { role: 'TEAM_ADMIN' }
            });

            if (!updateTeams)
                return {
                    success: false,
                    error: 'Error in adding user, please contact support - Error 1023'
                };

            revalidatePath('/company');

            await sendCompanyAddedAdminEmail({
                email: existingMember.email,
                name: existingMember.name,
                companyName: company.name
            });

            await logCompanyAdminAdded(userSession.user.id, {
                companyId: company.id,
                userId: existingMember.id
            });

            const members = await prisma.companyMember.findMany({
                where: { companyId: company.id, role: 'COMPANY_ADMIN' },
                include: { user: true },
                orderBy: { user: { name: 'asc' } }
            });

            return {
                success: true,
                method: 'added',
                members,
                error: null
            };
        } else {
            const pendingInvites = await prisma.companyInvite.findFirst({
                where: { companyId, email: values.email }
            });

            if (pendingInvites)
                return {
                    success: false,
                    error: 'An invitation has already been sent to this email'
                };

            const token = randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

            await prisma.companyInvite.create({
                data: {
                    email: values.email,
                    name: values.name,
                    role: 'COMPANY_ADMIN',
                    token,
                    expiresAt,
                    companyId,
                    invitedBy: user.id
                }
            });

            const link = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite/${token}`;
            await sendCompanyInviteAdminEmail({
                email: values.email,
                companyName: company.name,
                link,
                name: values.name,
                expiresAt
            });

            await logCompanyAdminInvited(userSession.user.id, {
                companyId: company.id,
                name: values.name,
                email: values.email
            });

            const invitations = await prisma.companyInvite.findMany({
                where: { companyId: company.id },
                orderBy: { createdAt: 'asc' }
            });

            revalidatePath('/company');

            return {
                success: true,
                method: 'invited',
                invitations,
                error: null
            };
        }
    } catch (error) {
        console.error('Failed to invite company member:', error);
        return { success: false, error: 'Failed to send invitation' };
    }
};

export const getCompanyAdminMembers = async () => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            data: null,
            error: 'Not authorised'
        };
    }

    const { company, userCompany } = userSession;

    if (userCompany.role !== 'COMPANY_ADMIN') {
        return {
            data: null,
            error: 'Not authorised'
        };
    }

    try {
        const members = await prisma.companyMember.findMany({
            where: { companyId: company.id, role: 'COMPANY_ADMIN' },
            include: { user: true },
            orderBy: { user: { name: 'asc' } }
        });

        if (!members) {
            return { data: null, error: 'Members not found' };
        }
        return { data: members, error: null };
    } catch (error) {
        console.error('Failed to fetch company members:', error);
        return { data: null, error: 'Error fetching members' };
    }
};

export const getCompanyInvitations = async () => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            data: null,
            error: 'Not authorised'
        };
    }

    const { company, userCompany } = userSession;

    if (userCompany.role !== 'COMPANY_ADMIN') {
        return {
            data: null,
            error: 'Not authorised'
        };
    }

    try {
        const invitations = await prisma.companyInvite.findMany({
            where: { companyId: company.id },
            orderBy: { createdAt: 'asc' }
        });

        return { data: invitations, error: null };
    } catch (error) {
        return {
            data: null,
            error: `Failed to fetch company invitations: ${error}`
        };
    }
};

export const cancelCompanyInvitation = async (id: string) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            data: null,
            error: 'Not authorised'
        };
    }

    const { company, userCompany } = userSession;

    if (userCompany.role !== 'COMPANY_ADMIN') {
        return {
            data: null,
            error: 'Not authorised'
        };
    }
    try {
        await prisma.companyInvite.delete({ where: { id } });

        const data = await prisma.companyInvite.findMany({
            where: { companyId: company.id },
            orderBy: { createdAt: 'asc' }
        });

        revalidatePath('/company');

        return { data, error: null };
    } catch (error) {
        console.error('Failed to cancel invitation:', error);
        return { data: null, error: 'Failed to cancel invitation' };
    }
};

export async function removeCompanyMember(memberId: string) {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            data: null,
            error: 'Not authorised'
        };
    }

    const { company, userCompany } = userSession;

    if (userCompany.role !== 'COMPANY_ADMIN') {
        return {
            data: null,
            error: 'Not authorised'
        };
    }
    try {
        console.log('[v0] Mock: Removing company member', memberId);

        // Mock: Prevent removing yourself
        if (memberId === '1') {
            return {
                success: false,
                error: 'Cannot remove yourself from the company'
            };
        }

        // Mock: Remove the member
        console.log('[v0] Mock: Removed member', memberId);

        // Mock: Create audit log
        console.log('[v0] Mock: Created audit log for removed member');

        return { success: true };
    } catch (error) {
        console.error('Failed to remove company member:', error);
        return { success: false, error: 'Failed to remove company member' };
    }
}

export async function changeCompanyMemberRole(
    memberId: string,
    newRole: 'COMPANY_ADMIN' | 'COMPANY_MEMBER'
) {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            data: null,
            error: 'Not authorised'
        };
    }

    const { company, userCompany } = userSession;

    if (userCompany.role !== 'COMPANY_ADMIN') {
        return {
            data: null,
            error: 'Not authorised'
        };
    }
    try {
        console.log('[v0] Mock: Changing company member role', {
            memberId,
            newRole
        });

        // Mock: Update the role
        console.log('[v0] Mock: Updated member role', { memberId, newRole });

        // Mock: Create audit log
        console.log('[v0] Mock: Created audit log for role change');

        return { success: true };
    } catch (error) {
        console.error('Failed to change company member role:', error);
        return { success: false, error: 'Failed to change member role' };
    }
}

export const resendCompanyInvitation = async (id: string) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            data: null,
            error: 'Not authorised'
        };
    }

    const { company, userCompany } = userSession;

    if (userCompany.role !== 'COMPANY_ADMIN') {
        return {
            data: null,
            error: 'Not authorised'
        };
    }
    try {
        const invite = await prisma.companyInvite.findUnique({ where: { id } });

        if (!invite) {
            return {
                data: null,
                error: 'Invite not found'
            };
        }

        if (new Date() > invite.expiresAt) {
            await prisma.companyInvite.update({
                where: { id },
                data: { status: 'EXPIRED' }
            });
            return {
                data: null,
                error: 'Invite expired'
            };
        }

        const link = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite/${invite.token}`;

        await sendCompanyInviteAdminEmail({
            email: invite.email,
            companyName: company.name,
            link,
            name: invite.name,
            expiresAt: invite.expiresAt
        });

        return { data: true, error: null };
    } catch (error) {
        return { data: null, error: `Failed to resend invitation - ${error}` };
    }
};
