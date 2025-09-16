'use server';

import * as z from 'zod';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';
import { InviteTeamMemberSchema } from '@/schemas/teamMember';
import {
    logTeamMemberAdded,
    logTeamMemberInvited
} from '@/actions/audit/audit-team';
import { TeamRole } from '@/generated/prisma';
import { sendTeamAddedEmail, sendTeamInviteEmail } from '@/lib/mail';
import { checkCompanyUserLimits } from '@/lib/team';

export const inviteTeamMember = async (
    values: z.infer<typeof InviteTeamMemberSchema>,
    teamId: string
) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            success: false,
            error: 'Not authorised'
        };
    }

    const { user, company } = userSession;

    try {
        const userTeamMember = await prisma.teamMember.findUnique({
            where: { teamId_userId: { userId: user.id, teamId } }
        });

        if (!userTeamMember || userTeamMember.role !== 'TEAM_ADMIN') {
            return {
                success: false,
                error: 'Not authorised'
            };
        }

        const team = await prisma.team.findUnique({
            where: { id: teamId }
        });

        if (!team) {
            return {
                success: false,
                error: 'Not authorised'
            };
        }

        // Validate input
        const validatedFields = InviteTeamMemberSchema.parse(values);

        const { name, email, role } = validatedFields;

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

            if (companyMember.companyId !== company.id)
                return {
                    success: false,
                    error: 'User belongs to a different company, unable to add them'
                };

            const teamMember = await prisma.teamMember.findUnique({
                where: {
                    teamId_userId: { userId: existingMember.id, teamId }
                },
                include: { team: true }
            });

            if (teamMember) {
                return {
                    success: false,
                    error: `This user is already in the team as ${teamMember.role === 'TEAM_ADMIN' ? 'an admin.' : 'a team member.'}`
                };
            } else {
                const addMember = await prisma.teamMember.create({
                    data: {
                        teamId,
                        userId: existingMember.id,
                        role: role as TeamRole
                    }
                });

                if (!addMember)
                    return {
                        success: false,
                        error: 'Error in adding user, please contact support - Error 9587'
                    };
            }

            revalidatePath(`/team/${team.slug}/members`);

            await sendTeamAddedEmail({
                email: existingMember.email,
                name: existingMember.name,
                companyName: company.name,
                teamName: team.name,
                role: (role as TeamRole) === 'TEAM_ADMIN' ? 'admin' : 'member'
            });

            await logTeamMemberAdded(userSession.user.id, {
                teamId: team.id,
                userId: existingMember.id,
                role
            });

            const data = await prisma.teamMember.findMany({
                where: { teamId: team.id },
                include: { user: { include: { companyMember: true } } },
                orderBy: { user: { name: 'asc' } }
            });

            const members = data.map((member) => ({
                id: member.id,
                name: `${member.user.name} ${member.user.lastName}`.trim(),
                firstName: member.user.name,
                lastName: member.user.lastName,
                email: member.user.email,
                role: member.role,
                avatar: member.user.image || undefined,
                joinedAt: member.createdAt,
                isCurrentUser: member.user.id === user.id,
                companyRole: member.user.companyMember[0].role
            }));

            return {
                success: true,
                method: 'added',
                members,
                error: null
            };
        } else {
            const limits = await checkCompanyUserLimits(company.id);

            if (!limits.canCreateUser) {
                return {
                    success: false,
                    error: 'User limit reached for your current plan'
                };
            }

            const pendingInvites = await prisma.teamInvite.findFirst({
                where: { teamId, email }
            });

            if (pendingInvites)
                return {
                    success: false,
                    error: 'An invitation has already been sent to this email'
                };

            const token = randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

            await prisma.teamInvite.create({
                data: {
                    email,
                    name,
                    role: role as TeamRole,
                    token,
                    expiresAt,
                    teamId,
                    invitedBy: user.id
                }
            });

            const link = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite/team/${token}`;
            await sendTeamInviteEmail({
                email: values.email,
                companyName: company.name,
                link,
                name: values.name,
                expiresAt,
                teamName: team.name,
                role: (role as TeamRole) === 'TEAM_ADMIN' ? 'admin' : 'member'
            });

            await logTeamMemberInvited(userSession.user.id, {
                teamId: team.id,
                name,
                email,
                role
            });

            const invitations = await prisma.teamInvite.findMany({
                where: { teamId, NOT: { status: 'ACCEPTED' } },
                orderBy: { createdAt: 'asc' }
            });

            revalidatePath(`/team/${team.slug}/members`);

            return {
                success: true,
                method: 'invited',
                invitations,
                error: null
            };
        }
    } catch (error) {
        console.error('Failed to invite company member:', error);
        return {
            success: false,
            error: `Failed to send invitation - ${error}`
        };
    }
};
