'use server';

import z from 'zod';
import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';
import { TeamSchema } from '@/schemas/team';
import { checkCompanyTeamLimits } from '@/lib/team';
import { revalidatePath } from 'next/cache';
import { logTeamDeleted, logTeamEnabled } from '@/actions/audit/audit-team';
import { TeamRole, TeamStatus, Prisma } from '@/generated/prisma';
import GithubSlugger from 'github-slugger';

const slugger = new GithubSlugger();

/* -------------------------------------------------------------
   Typed Includes
------------------------------------------------------------- */

const teamWithRelationsInclude = {
    members: { include: { user: true } },
    nudges: true,
    company: { include: { plan: true, members: true } }
} satisfies Prisma.TeamInclude;

export type TeamWithRelations = Prisma.TeamGetPayload<{
    include: typeof teamWithRelationsInclude;
}>;

export type TeamWithAdminCount = TeamWithRelations & {
    admins: number;
};

/* -------------------------------------------------------------
   Helpers
------------------------------------------------------------- */

function mapTeamToAdminCount(team: TeamWithRelations): TeamWithAdminCount {
    const admins = team.members.filter(
        (m) => m.role === TeamRole.TEAM_ADMIN
    ).length;

    return { ...team, admins };
}

/**
 * Loads full company teams (admin+disabled if allowed)
 */
async function fetchCompanyTeamsWithAdmins(
    companyId: string,
    role: TeamRole | string
): Promise<TeamWithAdminCount[]> {
    const where = {
        companyId,
        OR:
            role === 'COMPANY_ADMIN'
                ? [
                      { status: TeamStatus.ACTIVE },
                      { status: TeamStatus.DISABLED }
                  ]
                : [{ status: TeamStatus.ACTIVE }]
    };

    const teams = (await prisma.team.findMany({
        where,
        include: teamWithRelationsInclude,
        orderBy: [{ status: 'asc' }, { name: 'asc' }]
    })) as TeamWithRelations[];

    return teams.map(mapTeamToAdminCount);
}

/* -------------------------------------------------------------
   getCompanyTeams
------------------------------------------------------------- */

export const getCompanyTeams = async () => {
    const session = await authCheckServer();
    if (!session) {
        return { data: null, error: 'Not authorised' };
    }

    try {
        const teams = await fetchCompanyTeamsWithAdmins(
            session.company.id,
            session.userCompany.role
        );

        const members = await prisma.companyMember.findMany({
            where: { companyId: session.company.id },
            include: {
                user: { include: { teamMembers: { include: { team: true } } } }
            }
        });

        return { data: { teams, members }, error: null };
    } catch (error) {
        return { data: null, error: `Error getting teams - ${error}` };
    }
};

/* -------------------------------------------------------------
   getUserTeams
------------------------------------------------------------- */

export const getUserTeams = async () => {
    const session = await authCheckServer();
    if (!session) return null;

    try {
        const memberships = await prisma.teamMember.findMany({
            where: { userId: session.user.id },
            include: {
                team: {
                    include: {
                        company: true,
                        members: true,
                        nudges: true
                    }
                }
            },
            orderBy: { team: { name: 'asc' } }
        });

        return memberships.map((m) => ({
            id: m.team.id,
            name: m.team.name,
            role: m.role,
            memberCount: m.team.members.length,
            nudgesCount: m.team.nudges.length
        }));
    } catch {
        return null;
    }
};

/* -------------------------------------------------------------
   getCurrentTeam
------------------------------------------------------------- */

export const getCurrentTeam = async (teamId?: string) => {
    const session = await authCheckServer();
    if (!session) return null;

    const { user } = session;

    const fetchMembership = async () => {
        if (!teamId) {
            return prisma.teamMember.findFirst({
                where: { userId: user.id },
                include: {
                    team: {
                        include: {
                            company: { include: { plan: true } },
                            members: true,
                            nudges: true
                        }
                    }
                }
            });
        }

        return prisma.teamMember.findFirst({
            where: { userId: user.id, teamId },
            include: {
                team: {
                    include: {
                        company: { include: { plan: true } },
                        members: true,
                        nudges: true
                    }
                }
            }
        });
    };

    const membership = await fetchMembership();
    if (!membership) return null;

    const company = membership.team.company;

    return {
        id: membership.team.id,
        name: membership.team.name,
        companyName: company.name,
        companyPlan: company.plan,
        role: membership.role,
        memberCount: membership.team.members.length,
        tasksCount: membership.team.nudges.length,
        isCompanyTrialing: company.trialEndsAt
            ? new Date() < company.trialEndsAt
            : false,
        trialEndsAt: company.trialEndsAt
    };
};

/* -------------------------------------------------------------
   getCurrentTeamBySlug
------------------------------------------------------------- */

export const getCurrentTeamBySlug = async (slug: string) => {
    const session = await authCheckServer();
    if (!session) return null;

    try {
        const team = await prisma.team.findUnique({
            where: { slug, status: TeamStatus.ACTIVE },
            include: {
                company: { include: { plan: true } },
                nudges: { include: { completions: true } }
            }
        });

        if (!team) return null;

        const members = (await prisma.teamMember.findMany({
            where: { teamId: team.id },
            include: {
                user: { include: { companyMember: true } }
            },
            orderBy: [{ role: 'asc' }, { createdAt: 'asc' }]
        })) as Prisma.TeamMemberGetPayload<{
            include: { user: { include: { companyMember: true } } };
        }>[];

        const mappedMembers = members.map((m) => ({
            id: m.id,
            name: `${m.user.name} ${m.user.lastName}`.trim(),
            firstName: m.user.name,
            lastName: m.user.lastName,
            email: m.user.email,
            role: m.role,
            avatar: m.user.image ?? undefined,
            joinedAt: m.createdAt,
            isCurrentUser: m.user.id === session.user.id,
            companyRole: m.user.companyMember[0]?.role,
            status: m.status
        }));

        const invites = await prisma.teamInvite.findMany({
            where: { teamId: team.id, NOT: { status: 'ACCEPTED' } },
            orderBy: { createdAt: 'asc' }
        });

        const currentUserMember = mappedMembers.find(
            (m) => m.isCurrentUser === true
        );
        if (!currentUserMember) return null;

        return {
            team,
            members: mappedMembers,
            invites,
            userRole: currentUserMember.role
        };
    } catch (err) {
        console.error('Failed to fetch team by slug:', err);
        return null;
    }
};

/* -------------------------------------------------------------
   createTeam
------------------------------------------------------------- */

export const createTeam = async (
    values: z.infer<typeof TeamSchema>,
    companyId: string
) => {
    const session = await authCheckServer();
    if (!session) return { data: null, message: 'Not authorised' };

    if (session.userCompany.role !== 'COMPANY_ADMIN') {
        return { data: null, message: 'Not authorised' };
    }

    try {
        const validated = TeamSchema.safeParse(values);
        if (!validated.success) {
            return { data: null, message: 'Invalid fields' };
        }

        const name = values.name.trim();
        const description = values.description?.trim() || null;

        const limits = await checkCompanyTeamLimits(companyId);
        if (!limits.canCreateTeam) {
            return {
                data: null,
                error: 'Team limit reached for your current plan'
            };
        }

        const existing = await prisma.team.findFirst({
            where: {
                companyId,
                name,
                OR: [{ status: 'ACTIVE' }, { status: 'DISABLED' }]
            }
        });

        if (existing) {
            return {
                data: null,
                error: 'A team with this name already exists'
            };
        }

        slugger.reset();
        let slug = slugger.slug(name);
        while (await prisma.team.findUnique({ where: { slug } })) {
            slug = slugger.slug(name);
        }

        const team = await prisma.team.create({
            data: {
                name,
                slug,
                description,
                companyId,
                creatorId: session.user.id
            }
        });

        const companyAdmins = await prisma.companyMember.findMany({
            where: { companyId, role: 'COMPANY_ADMIN' }
        });

        for (const admin of companyAdmins) {
            await prisma.teamMember.create({
                data: {
                    teamId: team.id,
                    userId: admin.userId,
                    role: 'TEAM_ADMIN'
                }
            });
        }

        return { data: team, error: null };
    } catch (err) {
        return { data: null, error: `Failed to create team - ${err}` };
    }
};

/* -------------------------------------------------------------
   updateTeam
------------------------------------------------------------- */

export const updateTeam = async (
    values: z.infer<typeof TeamSchema>,
    teamId: string,
    companyId: string
) => {
    const session = await authCheckServer();
    if (!session) return { data: null, message: 'Not authorised' };

    try {
        const teamUser = await prisma.teamMember.findUnique({
            where: { teamId_userId: { userId: session.user.id, teamId } }
        });

        if (!teamUser || teamUser.role !== 'TEAM_ADMIN') {
            return { data: null, message: 'Not authorised' };
        }

        const validated = TeamSchema.safeParse(values);
        if (!validated.success) {
            return { data: null, message: 'Invalid fields' };
        }

        const current = await prisma.team.findUnique({ where: { id: teamId } });
        if (!current) {
            return {
                data: null,
                error: 'Unable to update team (Error 93474)'
            };
        }

        const name = values.name.trim();
        const description = values.description?.trim() || null;

        const existing = await prisma.team.findFirst({
            where: { companyId, name }
        });

        if (existing && existing.id !== teamId) {
            return { data: null, error: 'Team name already exists' };
        }

        let slug = current.slug;

        if (current.name !== name) {
            slugger.reset();
            slug = slugger.slug(name);
            while (await prisma.team.findUnique({ where: { slug } })) {
                slug = slugger.slug(name);
            }
        }

        const updated = await prisma.team.update({
            where: { id: teamId },
            data: { name, description, slug }
        });

        revalidatePath(`/team/${slug}`);

        return { data: updated, error: null };
    } catch (err) {
        return {
            data: null,
            error: 'Failed to update team (Error 93476)'
        };
    }
};

/* -------------------------------------------------------------
   deleteTeam
------------------------------------------------------------- */

export const deleteTeam = async (teamId: string) => {
    const session = await authCheckServer();
    if (!session) return { data: null, error: 'Not authorised' };

    if (session.userCompany.role !== 'COMPANY_ADMIN') {
        return { data: null, error: 'Only admins can delete teams' };
    }

    try {
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: { members: true, nudges: { where: { status: 'ACTIVE' } } }
        });

        if (!team) return { data: null, error: 'Team not found' };

        if (team.defaultTeam) {
            return { data: null, error: 'Cannot delete default team' };
        }

        if (team.nudges.length > 0) {
            return {
                data: null,
                error: 'Cannot delete team with active tasks. Complete or reassign tasks first.'
            };
        }

        await prisma.team.update({
            where: { id: teamId },
            data: { status: 'DELETED' }
        });

        await prisma.teamMember.updateMany({
            where: { teamId },
            data: { status: 'DISABLED' }
        });

        await prisma.teamInvite.deleteMany({ where: { teamId } });

        await logTeamDeleted(session.user.id, {
            teamId,
            teamName: team.name,
            nudgesCount: team.nudges.length,
            memberCount: team.members.length
        });

        const teams = await fetchCompanyTeamsWithAdmins(
            session.company.id,
            session.userCompany.role
        );

        revalidatePath(`/team`);

        return { data: teams, error: null };
    } catch (err) {
        console.error('Failed to delete team:', err);
        return { data: null, error: 'Failed to delete team' };
    }
};

/* -------------------------------------------------------------
   enableTeam
------------------------------------------------------------- */

export const enableTeam = async (teamId: string) => {
    const session = await authCheckServer();
    if (!session) return { data: null, error: 'Not authorised' };

    if (session.userCompany.role !== 'COMPANY_ADMIN') {
        return { data: null, error: 'Only admins can enable teams' };
    }

    try {
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: { members: true }
        });

        if (!team) return { data: null, error: 'Team not found' };

        const limits = await checkCompanyTeamLimits(session.company.id);
        if (!limits.canCreateTeam) {
            return { data: null, error: 'Team limit reached' };
        }

        await prisma.team.update({
            where: { id: teamId },
            data: { status: 'ACTIVE' }
        });

        const companyAdmins = await prisma.companyMember.findMany({
            where: { companyId: session.company.id, role: 'COMPANY_ADMIN' },
            include: { user: true }
        });

        for (const admin of companyAdmins) {
            const exists = team.members.some((m) => m.userId === admin.user.id);

            if (exists) {
                await prisma.teamMember.update({
                    where: {
                        teamId_userId: {
                            teamId: team.id,
                            userId: admin.user.id
                        }
                    },
                    data: { status: 'ACTIVE', role: 'TEAM_ADMIN' }
                });
            } else {
                await prisma.teamMember.create({
                    data: {
                        teamId: team.id,
                        userId: admin.user.id,
                        role: 'TEAM_ADMIN'
                    }
                });
            }
        }

        await logTeamEnabled(session.user.id, {
            teamId,
            teamName: team.name
        });

        const teams = await fetchCompanyTeamsWithAdmins(
            session.company.id,
            session.userCompany.role
        );

        revalidatePath(`/team`);

        return { data: teams, error: null };
    } catch (err) {
        console.error('Failed to enable team:', err);
        return { data: null, error: 'Failed to enable team' };
    }
};
