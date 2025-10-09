'use server';

import * as z from 'zod';
import GithubSlugger from 'github-slugger';

import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';
import { TeamSchema } from '@/schemas/team';
import { checkCompanyTeamLimits } from '@/lib/team';
import { revalidatePath } from 'next/cache';
import { logTeamDeleted, logTeamEnabled } from '@/actions/audit/audit-team';
import { TeamStatus } from '@/generated/prisma';

const slugger = new GithubSlugger();

export const getCompanyTeams = async () => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            data: null,
            error: 'Not authorised'
        };
    }

    const { user, company, userCompany } = userSession;

    try {
        let orClause = [];
        orClause.push({ status: TeamStatus.ACTIVE });

        if (userCompany.role === 'COMPANY_ADMIN') {
            orClause.push({ status: TeamStatus.DISABLED });
        }

        const teams = await prisma.team.findMany({
            where: {
                companyId: company.id,
                OR: orClause
            },
            include: {
                members: { include: { user: true } },
                nudges: true,
                company: { include: { plan: true, members: true } }
            },
            orderBy: [{ status: 'asc' }, { name: 'asc' }]
        });

        const returnTeams = teams.map((team) => {
            const members = team.members;
            const teamAdminCount = members.filter(
                (member) => member.role === 'TEAM_ADMIN'
            ).length;
            return {
                ...team,
                admins: teamAdminCount
            };
        });

        const members = await prisma.companyMember.findMany({
            where: { companyId: company.id },
            include: {
                user: { include: { teamMembers: { include: { team: true } } } }
            }
        });

        return { data: { teams: returnTeams, members }, error: null };
    } catch (error) {
        return { data: null, error: `Error getting teams - ${error}` };
    }
};

export const getUserTeams = async () => {
    try {
        const userSession = await authCheckServer();

        if (!userSession) {
            return null;
        }

        const { user } = userSession;
        const teams = await prisma.teamMember.findMany({
            where: {
                userId: user.id
            },
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

        return teams.map((membership) => ({
            id: membership.team.id,
            name: membership.team.name,
            role: membership.role,
            memberCount: membership.team.members.length,
            tasksCount: membership.team.nudges.length
        }));
    } catch (error) {
        return null;
    }
};

export const getCurrentTeam = async (teamId?: string) => {
    try {
        const userSession = await authCheckServer();

        if (!userSession) {
            return null;
        }

        const { user } = userSession;

        if (!teamId) {
            // Get the first team the user is a member of
            const firstMembership = await prisma.teamMember.findFirst({
                where: {
                    userId: user.id
                },
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

            if (!firstMembership) return null;
            return {
                id: firstMembership.team.id,
                name: firstMembership.team.name,
                companyName: firstMembership.team.company.name,
                companyPlan: firstMembership.team.company.plan,
                role: firstMembership.role,
                memberCount: firstMembership.team.members.length,
                tasksCount: firstMembership.team.nudges.length,
                isCompanyTrialing: firstMembership.team.company.trialEndsAt
                    ? new Date() < firstMembership.team.company.trialEndsAt
                    : false,
                trialEndsAt: firstMembership.team.company.trialEndsAt
            };
        }

        const membership = await prisma.teamMember.findFirst({
            where: {
                userId: user.id,
                teamId
            },
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

        if (!membership) return null;
        return {
            id: membership.team.id,
            name: membership.team.name,
            companyName: membership.team.company.name,
            companyPlan: membership.team.company.plan,
            role: membership.role,
            memberCount: membership.team.members.length,
            tasksCount: membership.team.nudges.length,
            isCompanyTrialing: membership.team.company.trialEndsAt
                ? new Date() < membership.team.company.trialEndsAt
                : false,
            trialEndsAt: membership.team.company.trialEndsAt
        };
    } catch (error) {
        console.error('Failed to fetch current team:', error);
        return null;
    }
};

export const getCurrentTeamBySlug = async (slug: string) => {
    try {
        const userSession = await authCheckServer();

        if (!userSession) {
            return null;
        }

        const { user } = userSession;

        const team = await prisma.team.findUnique({
            where: {
                slug,
                status: 'ACTIVE'
            },
            include: {
                company: { include: { plan: true } },
                nudges: { include: { completions: true } }
            }
        });

        if (!team) return null;

        const data = await prisma.teamMember.findMany({
            where: { teamId: team.id },
            include: {
                user: { include: { companyMember: true } }
            },
            orderBy: [
                { role: 'asc' }, // Admins first
                { createdAt: 'asc' }
            ]
        });

        const invites = await prisma.teamInvite.findMany({
            where: { teamId: team.id, NOT: { status: 'ACCEPTED' } },
            orderBy: { createdAt: 'asc' }
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
            companyRole: member.user.companyMember[0].role,
            status: member.status
        }));

        const currentUserMember = members.find(
            (member) => member.isCurrentUser === true
        );

        if (!currentUserMember) {
            return null;
        }

        return { team, members, invites, userRole: currentUserMember.role };
    } catch (error) {
        console.error('Failed to fetch current team:', error);
        return null;
    }
};

export const createTeam = async (
    values: z.infer<typeof TeamSchema>,
    companyId: string
) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            data: null,
            message: 'Not authorised'
        };
    }

    const { user, userCompany } = userSession;

    if (userCompany.role !== 'COMPANY_ADMIN') {
        return {
            data: null,
            message: 'Not authorised'
        };
    }

    try {
        // Validate input
        const validatedFields = TeamSchema.safeParse(values);

        if (!validatedFields.success) {
            return {
                data: null,
                message: 'Invalid fields'
            };
        }

        const name = values.name.trim();
        const description = values.description?.trim() || null;

        // Check company permissions and limits
        const limits = await checkCompanyTeamLimits(companyId);

        if (!limits.canCreateTeam) {
            return {
                data: null,
                error: 'Team limit reached for your current plan'
            };
        }

        // Check if team name already exists in this company
        const existingTeam = await prisma.team.findFirst({
            where: {
                companyId,
                name,
                OR: [{ status: 'ACTIVE' }, { status: 'DISABLED' }]
            }
        });

        if (existingTeam) {
            return {
                data: null,
                error: 'A team with this name already exists'
            };
        }

        let slug = slugger.slug(name);
        let slugExists = true;

        while (slugExists) {
            const checkSlug = await prisma.team.findUnique({
                where: { slug }
            });
            if (!checkSlug) {
                slugExists = false;
                break;
            } else {
                slug = slugger.slug(name);
            }
        }

        // Create the team
        const team = await prisma.team.create({
            data: {
                name,
                slug,
                description: description || null,
                companyId,
                creatorId: user.id
            }
        });

        if (!team) {
            return {
                data: null,
                error: 'An error occurred creating your team. Please try again.'
            };
        }

        // Add creator as team admin
        const companyAdmins = await prisma.companyMember.findMany({
            where: { role: 'COMPANY_ADMIN' },
            include: { user: true }
        });

        for (const admin of companyAdmins) {
            await prisma.teamMember.create({
                data: {
                    teamId: team.id,
                    userId: admin.user.id,
                    role: 'TEAM_ADMIN'
                }
            });
        }

        return { data: team, error: null };
    } catch (error) {
        return { data: null, error: `Failed to create team - ${error}` };
    }
};

export const updateTeam = async (
    values: z.infer<typeof TeamSchema>,
    teamId: string,
    companyId: string
) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            data: null,
            message: 'Not authorised'
        };
    }

    const { user } = userSession;

    try {
        const teamUser = await prisma.teamMember.findUnique({
            where: { teamId_userId: { userId: user.id, teamId } }
        });

        if (!teamUser || teamUser.role !== 'TEAM_ADMIN') {
            return {
                data: null,
                message: 'Not authorised'
            };
        }

        // Validate input
        const validatedFields = TeamSchema.safeParse(values);

        if (!validatedFields.success) {
            return {
                data: null,
                message: 'Invalid fields'
            };
        }

        const name = values.name.trim();
        const description = values.description?.trim() || null;

        const currentTeam = await prisma.team.findUnique({
            where: { id: teamId }
        });

        if (!currentTeam)
            return {
                data: null,
                error: 'An error occurred update the team. Please contact support - Error 93474'
            };

        // Check if team name already exists in this company
        const existingTeam = await prisma.team.findFirst({
            where: {
                companyId,
                name
            }
        });

        if (existingTeam && existingTeam.id !== teamId) {
            return {
                data: null,
                error: 'A team with this name already exists'
            };
        }

        let slug = currentTeam.slug;

        if (values.name !== currentTeam.name) {
            slug = slugger.slug(name);
            let slugExists = true;

            while (slugExists) {
                const checkSlug = await prisma.team.findUnique({
                    where: { slug }
                });
                if (!checkSlug) {
                    slugExists = false;
                    break;
                } else {
                    slug = slugger.slug(name);
                }
            }
        }

        // Create the team
        const team = await prisma.team.update({
            where: { id: teamId },
            data: {
                name,
                slug,
                description: description || null
            }
        });

        if (!team) {
            return {
                data: null,
                error: 'An error occurred creating your team. Please try again. If this continues, please contact support - Error 93475'
            };
        }

        revalidatePath(`/team/${slug}`);

        return { data: team, error: null };
    } catch (error) {
        return {
            data: null,
            error: 'Failed to create team, please contact support - Error 93476'
        };
    }
};

export const deleteTeam = async (teamId: string) => {
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
            error: 'Only company admins can delete teams'
        };
    }

    try {
        // Get the team with company info
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                members: true,
                nudges: { where: { status: 'ACTIVE' } }
            }
        });

        if (!team) {
            return { data: null, error: 'Team not found' };
        }

        // Prevent deleting team with active tasks
        if (team.nudges.length > 0) {
            return {
                data: null,
                error: 'Cannot delete team with active tasks. Please complete or reassign all tasks first.'
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

        await prisma.nudge.updateMany({
            where: { teamId },
            data: { status: 'DISABLED' }
        });

        await logTeamDeleted(user.id, {
            teamId,
            teamName: team.name,
            nudgesCount: team.nudges.length,
            memberCount: team.members.length
        });

        const teams = await prisma.team.findMany({
            where: {
                companyId: company.id,
                OR: [{ status: 'ACTIVE' }, { status: 'DISABLED' }]
            },
            include: {
                members: { include: { user: true } },
                nudges: true,
                company: { include: { plan: true, members: true } }
            },
            orderBy: [{ status: 'asc' }, { name: 'asc' }]
        });

        const returnTeams = teams.map((team) => {
            const members = team.members;
            const teamAdminCount = members.filter(
                (member) => member.role === 'TEAM_ADMIN'
            ).length;
            return {
                ...team,
                admins: teamAdminCount
            };
        });

        revalidatePath(`/team`);

        return { data: returnTeams, error: null };
    } catch (error) {
        console.error('Failed to delete team:', error);
        return { data: null, error: 'Failed to delete team' };
    }
};

export const enableTeam = async (teamId: string) => {
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
            error: 'Only company admins can enable teams'
        };
    }

    try {
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                members: true,
                nudges: true
            }
        });
        if (!team) {
            return { data: null, error: 'Team not found' };
        }

        const limits = await checkCompanyTeamLimits(company.id);

        if (!limits.canCreateTeam) {
            return {
                data: null,
                error: 'Team limit reached for your current plan'
            };
        }
        await prisma.team.update({
            where: { id: teamId },
            data: { status: 'ACTIVE' }
        });

        const companyAdmins = await prisma.companyMember.findMany({
            where: { role: 'COMPANY_ADMIN' },
            include: { user: true }
        });

        for (const admin of companyAdmins) {
            const isAdminInTeam = team.members.some(
                (member) => member.userId === admin.user.id
            );
            if (isAdminInTeam) {
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
        await logTeamEnabled(user.id, {
            teamId,
            teamName: team.name
        });

        const teams = await prisma.team.findMany({
            where: {
                companyId: company.id,
                OR: [{ status: 'ACTIVE' }, { status: 'DISABLED' }]
            },
            include: {
                members: { include: { user: true } },
                nudges: true,
                company: { include: { plan: true, members: true } }
            },
            orderBy: [{ status: 'asc' }, { name: 'asc' }]
        });

        const returnTeams = teams.map((team) => {
            const members = team.members;
            const teamAdminCount = members.filter(
                (member) => member.role === 'TEAM_ADMIN'
            ).length;
            return {
                ...team,
                admins: teamAdminCount
            };
        });

        revalidatePath(`/team`);

        return { data: returnTeams, error: null };
    } catch (error) {
        console.error('Failed to enable team:', error);
        return { data: null, error: 'Failed to enable team' };
    }
};
