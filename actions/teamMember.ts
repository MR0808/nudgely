'use server';

import * as z from 'zod';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';
import { InviteTeamMemberSchema } from '@/schemas/teamMember';
import {
    logTeamMemberAdded,
    logTeamMemberEnabled,
    logTeamMemberInvited,
    logTeamMemberRemoved,
    logTeamMemberRoleUpdated,
    logTeamUpdateMemberTeams
} from '@/actions/audit/audit-team';
import { TeamRole } from '@/generated/prisma';
import { sendTeamAddedEmail, sendTeamInviteEmail } from '@/lib/mail';
import { checkCompanyUserLimits } from '@/lib/team';

/**
 * Helper — load members with full relations (Accelerate safe)
 */
async function loadTeamMembers(
    teamId: string,
    currentUserId: string
): Promise<
    {
        id: string;
        name: string;
        firstName: string;
        lastName: string;
        email: string;
        role: 'TEAM_ADMIN' | 'TEAM_MEMBER';
        avatar: string | undefined;
        joinedAt: Date;
        isCurrentUser: boolean;
        companyRole: 'COMPANY_ADMIN' | 'COMPANY_MEMBER';
        status: 'ACTIVE' | 'DISABLED' | 'BANNED';
    }[]
> {
    // 1. Load teamMember rows (Accelerate-safe: no relations)
    const members = await prisma.teamMember.findMany({
        where: { teamId },
        select: {
            id: true,
            role: true,
            status: true,
            createdAt: true,
            userId: true
        },
        orderBy: [{ role: 'asc' }, { createdAt: 'asc' }]
    });

    if (members.length === 0) return [];

    // 2. Load all user rows in one Accelerate-safe query
    const users = await prisma.user.findMany({
        where: { id: { in: members.map((m) => m.userId) } },
        select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            image: true,
            companyMember: {
                select: { role: true }
            }
        }
    });

    // 3. Merge user + member records into UI format
    return members.map((m) => {
        const u = users.find((u) => u.id === m.userId);

        return {
            id: m.id,
            name: `${u?.name ?? ''} ${u?.lastName ?? ''}`.trim(),
            firstName: u?.name ?? '',
            lastName: u?.lastName ?? '',
            email: u?.email ?? '',
            role: m.role,
            avatar: u?.image ?? undefined,
            joinedAt: m.createdAt,
            isCurrentUser: u?.id === currentUserId,
            companyRole: u?.companyMember?.[0]?.role ?? 'COMPANY_MEMBER',
            status: m.status
        };
    });
}

/* ============================================================
   INVITE TEAM MEMBER
   ============================================================ */
export const inviteTeamMember = async (
    values: z.infer<typeof InviteTeamMemberSchema>,
    teamId: string
) => {
    const session = await authCheckServer();
    if (!session) return { success: false, error: 'Not authorised' };

    const { user, company } = session;

    try {
        const adminCheck = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId: user.id } }
        });

        if (!adminCheck || adminCheck.role !== 'TEAM_ADMIN') {
            return { success: false, error: 'Not authorised' };
        }

        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) return { success: false, error: 'Not authorised' };

        const { name, email, role } = InviteTeamMemberSchema.parse(values);

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        /* --- EXISTING USER FLOW --- */
        if (existingUser) {
            const companyMember = await prisma.companyMember.findFirst({
                where: { userId: existingUser.id }
            });

            if (!companyMember) return { success: false, error: 'Error 1021' };

            if (companyMember.companyId !== company.id)
                return {
                    success: false,
                    error: 'User belongs to another company'
                };

            const already = await prisma.teamMember.findUnique({
                where: {
                    teamId_userId: { teamId, userId: existingUser.id }
                },
                include: { team: true }
            });

            if (already) {
                return {
                    success: false,
                    error:
                        already.role === 'TEAM_ADMIN'
                            ? 'User already an admin.'
                            : 'User already a member.'
                };
            }

            await prisma.teamMember.create({
                data: {
                    teamId,
                    userId: existingUser.id,
                    role: role as TeamRole
                }
            });

            revalidatePath(`/team/${team.slug}/members`);

            await sendTeamAddedEmail({
                email: existingUser.email,
                name: existingUser.name,
                companyName: company.name,
                teamName: team.name,
                role: role === 'TEAM_ADMIN' ? 'admin' : 'member'
            });

            await logTeamMemberAdded(session.user.id, {
                teamId: team.id,
                userId: existingUser.id,
                role
            });

            const members = await loadTeamMembers(team.id, user.id);

            return {
                success: true,
                method: 'added',
                members,
                error: null
            };
        }

        /* --- NEW USER INVITE FLOW --- */

        const limits = await checkCompanyUserLimits(company.id);
        if (!limits.canCreateUser)
            return { success: false, error: 'User limit reached' };

        const pending = await prisma.teamInvite.findFirst({
            where: { teamId, email }
        });

        if (pending) return { success: false, error: 'Invite already exists' };

        const token = randomBytes(32).toString('hex');

        await prisma.teamInvite.create({
            data: {
                email,
                name,
                role: role as TeamRole,
                teamId,
                invitedBy: user.id,
                token,
                expiresAt: new Date(Date.now() + 7 * 86400000)
            }
        });

        const link = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite/team/${token}`;

        await sendTeamInviteEmail({
            email,
            name,
            companyName: company.name,
            teamName: team.name,
            link,
            expiresAt: new Date(Date.now() + 7 * 86400000),
            role: role === 'TEAM_ADMIN' ? 'admin' : 'member'
        });

        await logTeamMemberInvited(session.user.id, {
            teamId,
            name,
            email,
            role
        });

        const invitations = await prisma.teamInvite.findMany({
            where: { teamId, NOT: { status: 'ACCEPTED' } }
        });

        return {
            success: true,
            method: 'invited',
            invitations,
            error: null
        };
    } catch (err) {
        console.error(err);
        return { success: false, error: 'Failed to send invite' };
    }
};

/* ============================================================
   RESEND INVITE
   ============================================================ */
export const resendTeamInvitation = async (id: string, teamId: string) => {
    const session = await authCheckServer();
    if (!session) return { data: null, error: 'Not authorised' };

    const { user, company } = session;

    try {
        const adminCheck = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId: user.id } }
        });

        if (!adminCheck || adminCheck.role !== 'TEAM_ADMIN')
            return { data: null, error: 'Not authorised' };

        const invite = await prisma.teamInvite.findUnique({
            where: { id },
            include: { team: true }
        });

        if (!invite) return { data: null, error: 'Invite not found' };

        const link = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite/team/${invite.token}`;

        await sendTeamInviteEmail({
            email: invite.email,
            name: invite.name,
            companyName: company.name,
            teamName: invite.team.name,
            expiresAt: invite.expiresAt,
            link,
            role: invite.role === 'TEAM_ADMIN' ? 'admin' : 'member'
        });

        return { data: true, error: null };
    } catch (err) {
        console.error(err);
        return { data: null, error: 'Failed to resend' };
    }
};

/* ============================================================
   CANCEL INVITE
   ============================================================ */
export const cancelTeamInvitation = async (
    id: string,
    teamId: string,
    slug: string
) => {
    const session = await authCheckServer();
    if (!session) return { success: false, error: 'Not authorised' };

    const { user } = session;

    try {
        const adminCheck = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId: user.id } }
        });

        if (!adminCheck || adminCheck.role !== 'TEAM_ADMIN')
            return { success: false, error: 'Not authorised' };

        await prisma.teamInvite.delete({ where: { id } });

        const invites = await prisma.teamInvite.findMany({
            where: { teamId, NOT: { status: 'ACCEPTED' } }
        });

        revalidatePath(`/team/${slug}/members`);
        return { success: true, data: invites, error: null };
    } catch (err) {
        console.error(err);
        return { success: false, error: 'Failed to cancel invite' };
    }
};

/* ============================================================
   CHANGE ROLE
   ============================================================ */
export const changeTeamMemberRole = async (
    memberId: string,
    newRole: 'TEAM_ADMIN' | 'TEAM_MEMBER',
    teamId: string
) => {
    const session = await authCheckServer();
    if (!session) return { data: null, error: 'Not authorised' };

    const { user } = session;

    try {
        const adminCheck = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId: user.id } }
        });

        if (!adminCheck || adminCheck.role !== 'TEAM_ADMIN')
            return { data: null, error: 'Not authorised' };

        const member = await prisma.teamMember.findUnique({
            where: { id: memberId },
            include: { team: true, user: true }
        });

        if (!member) return { data: null, error: 'Not found' };
        if (member.team.creatorId === member.userId)
            return { data: null, error: 'Cannot change creator' };

        await prisma.teamMember.update({
            where: { id: memberId },
            data: { role: newRole }
        });

        const members = await loadTeamMembers(teamId, user.id);

        await logTeamMemberRoleUpdated(session.user.id, {
            teamId,
            targetUserId: member.userId,
            targetUserEmail: member.user.email,
            oldRole: member.role,
            newRole
        });

        return { data: members, error: null };
    } catch (err) {
        console.error(err);
        return { data: null, error: 'Failed to change role' };
    }
};

/* ============================================================
   REMOVE MEMBER
   ============================================================ */
export const removeTeamMember = async (memberId: string, teamId: string) => {
    const session = await authCheckServer();
    if (!session) return { data: null, error: 'Not authorised' };

    const { user } = session;

    try {
        const adminCheck = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId: user.id } }
        });

        if (!adminCheck || adminCheck.role !== 'TEAM_ADMIN')
            return { data: null, error: 'Not authorised' };

        const member = await prisma.teamMember.findUnique({
            where: { id: memberId },
            include: { team: true, user: true }
        });

        if (!member) return { data: null, error: 'Not found' };
        if (member.team.creatorId === member.userId)
            return { data: null, error: 'Cannot remove creator' };
        if (member.team.defaultTeam)
            return { data: null, error: 'Cannot remove from default team' };
        if (member.userId === user.id)
            return { data: null, error: 'Cannot remove yourself' };

        await prisma.teamMember.delete({ where: { id: memberId } });

        await logTeamMemberRemoved(session.user.id, {
            teamId,
            targetUserId: member.userId,
            targetUserEmail: member.user.email
        });

        const members = await loadTeamMembers(teamId, user.id);
        return { data: members, error: null };
    } catch (err) {
        console.error(err);
        return { data: null, error: 'Failed to remove member' };
    }
};

/* ============================================================
   UPDATE MEMBER TEAMS
   ============================================================ */
export const updateTeamMember = async (
    memberId: string,
    addTeams: string[],
    removeTeams: string[]
) => {
    const session = await authCheckServer();
    if (!session) return { data: null, error: 'Not authorised' };

    const { user, company, userCompany } = session;

    if (userCompany.role !== 'COMPANY_ADMIN')
        return { data: null, error: 'Not authorised' };

    try {
        const member = await prisma.user.findUnique({
            where: { id: memberId }
        });

        if (!member) return { data: null, error: 'User not found' };

        for (const t of addTeams) {
            const exists = await prisma.teamMember.findUnique({
                where: { teamId_userId: { teamId: t, userId: memberId } }
            });

            if (!exists) {
                await prisma.teamMember.create({
                    data: {
                        userId: memberId,
                        teamId: t,
                        role: 'TEAM_MEMBER'
                    }
                });
            }
        }

        for (const t of removeTeams) {
            await prisma.teamMember.delete({
                where: { teamId_userId: { teamId: t, userId: memberId } }
            });
        }

        await logTeamUpdateMemberTeams(user.id, {
            memberId,
            addTeams,
            removeTeams
        });

        const members = await prisma.companyMember.findMany({
            where: { companyId: company.id },
            include: {
                user: {
                    include: {
                        teamMembers: {
                            include: { team: true }
                        }
                    }
                }
            }
        });

        return { data: members, error: null };
    } catch (err) {
        console.error(err);
        return { data: null, error: 'Failed to update member' };
    }
};

/* ============================================================
   ENABLE MEMBER
   ============================================================ */
export const enableTeamMember = async (memberId: string, teamId: string) => {
    const session = await authCheckServer();
    if (!session) return { data: null, error: 'Not authorised' };

    const { user } = session;

    try {
        const adminCheck = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId: user.id } }
        });

        if (!adminCheck || adminCheck.role !== 'TEAM_ADMIN')
            return { data: null, error: 'Not authorised' };

        const member = await prisma.teamMember.findUnique({
            where: { id: memberId },
            include: {
                team: true,
                user: true
            }
        });

        if (!member) return { data: null, error: 'Not found' };

        await prisma.teamMember.update({
            where: { id: memberId },
            data: { status: 'ACTIVE' }
        });

        await logTeamMemberEnabled(session.user.id, {
            teamId,
            targetUserId: member.userId,
            targetUserEmail: member.user.email
        });

        const members = await loadTeamMembers(teamId, user.id);

        return { data: members, error: null };
    } catch (err) {
        console.error(err);
        return { data: null, error: 'Failed to enable member' };
    }
};
