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
    logCompanyAdminInvited,
    logCompanyAdminRemoved,
    logCompanyMemberDeactivated,
    logCompanyMemberReactivated
} from '@/actions/audit/audit-company';
import { checkCompanyUserLimits } from '@/lib/team';

export const inviteCompanyAdmin = async (
    values: z.infer<typeof InviteCompanyAdminSchema>,
    companyId: string
) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            success: false,
            error: 'Not authorised'
        };
    }

    const { user, company, userCompany } = userSession;

    if (userCompany.role !== 'COMPANY_ADMIN') {
        return {
            success: false,
            error: 'Not authorised'
        };
    }

    try {
        // Validate input
        const validatedFields = InviteCompanyAdminSchema.safeParse(values);

        if (!validatedFields.success) {
            return {
                success: false,
                message: 'Invalid fields'
            };
        }

        const existingMember = await prisma.user.findUnique({
            where: { email: values.email }
        });

        const limits = await checkCompanyUserLimits(company.id);

        const admins = await prisma.companyMember.findMany({
            where: { role: 'COMPANY_ADMIN' }
        });

        if (
            limits.currentPlan.maxAdmin !== 0 &&
            admins.length >= limits.currentPlan.maxAdmin
        ) {
            return {
                success: false,
                error: 'Admin limit reached for your current plan'
            };
        }

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

            const teams = await prisma.team.findMany({ where: { companyId } });

            for (const team of teams) {
                const updateTeam = await prisma.teamMember.findFirst({
                    where: { teamId: team.id, userId: user.id }
                });

                if (updateTeam) {
                    await prisma.teamMember.update({
                        where: { id: updateTeam.id },
                        data: { role: 'TEAM_ADMIN' }
                    });
                } else {
                    await prisma.teamMember.create({
                        data: {
                            teamId: team.id,
                            userId: existingMember.id,
                            role: 'TEAM_ADMIN'
                        }
                    });
                }
            }

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

            if (!limits.canCreateUser) {
                return {
                    success: false,
                    error: 'User limit reached for your current plan'
                };
            }

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

            const link = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite/company/${token}`;
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
                where: { companyId: company.id, NOT: { status: 'ACCEPTED' } },
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
            where: { companyId: company.id, NOT: { status: 'ACCEPTED' } },
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
            where: { companyId: company.id, NOT: { status: 'ACCEPTED' } },
            orderBy: { createdAt: 'asc' }
        });

        revalidatePath('/company');

        return { data, error: null };
    } catch (error) {
        console.error('Failed to cancel invitation:', error);
        return { data: null, error: 'Failed to cancel invitation' };
    }
};

export const removeCompanyAdminMember = async (memberId: string) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            success: false,
            members: null,
            error: 'Not authorised'
        };
    }

    const { company, userCompany, user } = userSession;

    if (userCompany.role !== 'COMPANY_ADMIN') {
        return {
            success: false,
            members: null,
            error: 'Not authorised'
        };
    }
    try {
        // Mock: Prevent removing yourself
        if (memberId === user.id) {
            return {
                success: false,
                members: null,
                error: 'Cannot remove yourself from the company'
            };
        }

        const companyMember = await prisma.companyMember.update({
            where: { id: memberId },
            data: { role: 'COMPANY_MEMBER' }
        });

        await prisma.teamMember.updateMany({
            where: { userId: companyMember.id },
            data: { role: 'TEAM_MEMBER' }
        });

        await logCompanyAdminRemoved(userSession.user.id, {
            companyId: company.id,
            adminRemoved: memberId
        });

        const members = await prisma.companyMember.findMany({
            where: { companyId: company.id, role: 'COMPANY_ADMIN' },
            include: { user: true },
            orderBy: { user: { name: 'asc' } }
        });

        return {
            success: true,
            members,
            error: null
        };
    } catch (error) {
        console.error('Failed to remove company member:', error);
        return {
            success: false,
            members: null,
            error: 'Failed to remove company member'
        };
    }
};

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

        const link = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite/company/${invite.token}`;

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

export const deactivateMember = async (memberId: string) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            data: null,
            error: 'Not authorised'
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
        const userCompany = await prisma.companyMember.findUnique({
            where: {
                companyId_userId: { companyId: company.id, userId: memberId }
            }
        });

        if (!userCompany) {
            return { data: null, error: 'Member not found' };
        }

        if (userCompany.role === 'COMPANY_ADMIN') {
            return {
                data: null,
                error: 'Unable to remove company admin. Please demote them first.'
            };
        }

        // Prevent removing the team creator
        if (company.creatorId === memberId) {
            return { data: null, error: 'Cannot remove the company creator' };
        }

        // Prevent removing yourself
        if (memberId === user.id) {
            return {
                data: null,
                error: 'Cannot remove yourself from the company'
            };
        }

        // Remove the member
        await prisma.teamMember.deleteMany({
            where: { userId: memberId }
        });

        await prisma.user.update({
            where: { id: memberId },
            data: { status: 'DISABLED' }
        });

        await logCompanyMemberDeactivated(userSession.user.id, {
            companyId: company.id,
            memberId
        });

        const members = await prisma.companyMember.findMany({
            where: { companyId: company.id },
            include: {
                user: { include: { teamMembers: { include: { team: true } } } }
            }
        });

        revalidatePath('/team');

        return { data: members, error: null };
    } catch (error) {
        console.error('Failed to remove team member:', error);
        return { data: null, error: 'Failed to remove team member' };
    }
};

export const reactivateMember = async (memberId: string) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            data: null,
            error: 'Not authorised'
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
        const userCompany = await prisma.companyMember.findUnique({
            where: {
                companyId_userId: { companyId: company.id, userId: memberId }
            }
        });

        if (!userCompany) {
            return { data: null, error: 'Member not found' };
        }

        const limits = await checkCompanyUserLimits(company.id);

        if (!limits.canCreateUser) {
            return {
                data: null,
                error: 'User limit reached for your current plan'
            };
        }

        await prisma.user.update({
            where: { id: memberId },
            data: { status: 'ACTIVE' }
        });

        await logCompanyMemberReactivated(userSession.user.id, {
            companyId: company.id,
            memberId
        });

        const members = await prisma.companyMember.findMany({
            where: { companyId: company.id },
            include: {
                user: { include: { teamMembers: { include: { team: true } } } }
            }
        });

        revalidatePath('/team');

        return { data: members, error: null };
    } catch (error) {
        console.error('Failed to remove team member:', error);
        return { data: null, error: 'Failed to remove team member' };
    }
};
