import { prisma } from '@/lib/prisma';

export async function checkCompanyPermission(
    userId: string,
    companyId: string,
    requiredRole: 'COMPANY_ADMIN' | 'COMPANY_MEMBER' = 'COMPANY_MEMBER'
) {
    const membership = await prisma.companyMember.findFirst({
        where: {
            userId,
            companyId
        },
        include: {
            company: true
        }
    });

    if (!membership) {
        throw new Error('Access denied: Not a member of this company');
    }

    if (
        requiredRole === 'COMPANY_ADMIN' &&
        membership.role !== 'COMPANY_ADMIN'
    ) {
        throw new Error('Access denied: Company admin permissions required');
    }

    return membership;
}

export async function checkTeamPermission(
    userId: string,
    teamId: string,
    requiredRole: 'TEAM_ADMIN' | 'TEAM_MEMBER' = 'TEAM_MEMBER'
) {
    const membership = await prisma.teamMember.findFirst({
        where: {
            userId,
            teamId
        },
        include: {
            team: {
                include: {
                    company: true
                }
            }
        }
    });

    if (!membership) {
        throw new Error('Access denied: Not a member of this team');
    }

    if (requiredRole === 'TEAM_ADMIN' && membership.role !== 'TEAM_ADMIN') {
        throw new Error('Access denied: Team admin permissions required');
    }

    return membership;
}

export const checkCompanyTeamLimits = async (companyId: string) => {
    try {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            include: { teams: true }
        });

        if (!company) {
            throw new Error('Company not found');
        }

        const plan = await prisma.plan.findUnique({
            where: { id: company.planId }
        });

        if (!plan) {
            throw new Error('Plan not found');
        }

        if (plan.maxTeams === 0) {
            return {
                canCreateTeam: true,
                currentPlan: plan,
                teamCount: company.teams.length
            };
        }

        return {
            canCreateTeam: company.teams.length < plan.maxTeams,
            currentPlan: plan,
            teamCount: company.teams.length
        };
    } catch (error) {
        throw new Error('Failed to check company');
    }
};

export async function getUserCompanyRole(userId: string, companyId: string) {
    const membership = await prisma.companyMember.findFirst({
        where: {
            userId,
            companyId
        }
    });

    return membership?.role || null;
}

export async function getUserTeamRole(userId: string, teamId: string) {
    const membership = await prisma.teamMember.findFirst({
        where: {
            userId,
            teamId
        }
    });

    return membership?.role || null;
}
