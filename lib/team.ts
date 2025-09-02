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

export async function checkCompanyLimits(userId: string, companyId?: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            companyMember: {
                include: {
                    company: {
                        include: {
                            teams: true,
                            members: true
                        }
                    }
                }
            }
        }
    });

    if (!user) throw new Error('User not found');

    // Check if user can create more companies (Free users limited to 1)
    const ownedCompanies = user.companyMember.filter(
        (m) => m.role === 'COMPANY_ADMIN' && m.company.creatorId === userId
    );

    if (companyId) {
        const company = user.companyMember.find(
            (m) => m.companyId === companyId
        )?.company;

        if (!company) {
            throw new Error('Company not found');
        }

        return {
            canCreateCompany: ownedCompanies.length === 0,
            canCreateTeam: company.plan === 'PRO' || company.teams.length === 0,
            currentPlan: company.plan,
            isCompanyAdmin: user.companyMember.some(
                (m) => m.companyId === companyId && m.role === 'COMPANY_ADMIN'
            ),
            memberCount: company.members.length,
            teamCount: company.teams.length
        };
    }

    return {
        canCreateCompany: ownedCompanies.length === 0,
        ownedCompaniesCount: ownedCompanies.length
    };
}

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
