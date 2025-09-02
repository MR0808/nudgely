'use server';

import * as z from 'zod';
import GithubSlugger from 'github-slugger';

import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';
import { CreateTeamSchema } from '@/schemas/team';
import { checkCompanyLimits } from '@/lib/team';

const slugger = new GithubSlugger();

export const getUserTeams = async () => {
    try {
        console.log('a');

        const userSession = await authCheckServer();
        console.log('b');

        if (!userSession) {
            return null;
        }
        console.log('c');

        const { user } = userSession;
        console.log('d');

        const teams = await prisma.teamMember.findMany({
            where: {
                userId: user.id
            },
            include: {
                team: {
                    include: {
                        company: true,
                        members: true,
                        tasks: true
                    }
                }
            }
        });
        console.log('e');

        return teams.map((membership) => ({
            id: membership.team.id,
            name: membership.team.name,
            role: membership.role,
            memberCount: membership.team.members.length,
            tasksCount: membership.team.tasks.length
        }));
    } catch (error) {
        console.log('f');

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
                            company: true,
                            members: true,
                            tasks: true
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
                tasksCount: firstMembership.team.tasks.length,
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
                        company: true,
                        members: true,
                        tasks: true
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
            tasksCount: membership.team.tasks.length,
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

export const createTeam = async (
    values: z.infer<typeof CreateTeamSchema>,
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
        // Validate input
        const validatedFields = CreateTeamSchema.safeParse(values);

        if (!validatedFields.success) {
            return {
                data: null,
                message: 'Invalid fields'
            };
        }

        const name = values.name.trim();
        const description = values.description?.trim() || null;

        // Check company permissions and limits
        const limits = await checkCompanyLimits(user.id, companyId);

        if (!limits.isCompanyAdmin) {
            return {
                data: null,
                error: 'Only company admins can create teams'
            };
        }

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
                name
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
        const teamMember = await prisma.teamMember.create({
            data: {
                teamId: team.id,
                userId: user.id,
                role: 'TEAM_ADMIN'
            },
            include: {
                team: {
                    include: {
                        company: true,
                        members: true,
                        tasks: true
                    }
                }
            }
        });

        if (!teamMember) {
            return {
                data: null,
                error: 'An error occurred creating your team. Please try again.'
            };
        }

        return { data: { team, teamMember }, error: null };
    } catch (error) {
        return { data: null, error: 'Failed to create team' };
    }
};
