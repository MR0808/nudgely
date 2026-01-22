'use server';

import * as z from 'zod';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma';
import { getCompanyContext } from '@/lib/companyContext';
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

/* ------------------------------------------------------------------
 * 🧩 Types
 * ------------------------------------------------------------------ */

// Standard action result shape
type ActionResult<T> = {
    success: boolean;
    data: T | null;
    error: string | null;
};

// Prisma payload helpers

// companyMember with user included
type CompanyAdminMember = Prisma.CompanyMemberGetPayload<{
    include: { user: true };
}>;

// companyMember with user + teamMembers + team
type CompanyMemberWithTeams = Prisma.CompanyMemberGetPayload<{
    include: {
        user: {
            include: {
                teamMembers: { include: { team: true } };
            };
        };
    };
}>;

// companyInvite row
type CompanyInviteRow = Prisma.CompanyInviteGetPayload<{}>;

const fetchCompanyAdminMembers = async (
    companyId: string
): Promise<CompanyAdminMember[]> => {
    const members = await prisma.companyMember.findMany({
        where: { companyId, role: 'COMPANY_ADMIN' },
        include: { user: true },
        orderBy: { user: { name: 'asc' } }
    });

    return members as CompanyAdminMember[];
};

/* ------------------------------------------------------------------
 * 📨 Invite / Add Company Admin
 * ------------------------------------------------------------------ */

export const inviteCompanyAdmin = async (
    values: z.infer<typeof InviteCompanyAdminSchema>,
    companyId: string
): Promise<
    ActionResult<
        | { method: 'added'; members: CompanyAdminMember[] }
        | { method: 'invited'; invitations: CompanyInviteRow[] }
    >
> => {
    const ctx = await getCompanyContext();

    if (!ctx) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    const { user, company, userCompany, isAdmin } = ctx;

    if (!isAdmin || !userCompany || userCompany.companyId !== companyId) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    try {
        // Validate input
        const validated = InviteCompanyAdminSchema.safeParse(values);

        if (!validated.success) {
            return {
                success: false,
                data: null,
                error: 'Invalid fields'
            };
        }

        const data = validated.data;

        // Run independent checks in parallel
        const [existingMember, limits, admins] = await Promise.all([
            prisma.user.findUnique({
                where: { email: data.email }
            }),
            checkCompanyUserLimits(company.id),
            prisma.companyMember.findMany({
                where: { companyId, role: 'COMPANY_ADMIN' }
            })
        ]);

        // Plan admin limit check
        if (
            limits.currentPlan.maxAdmin !== 0 &&
            admins.length >= limits.currentPlan.maxAdmin
        ) {
            return {
                success: false,
                data: null,
                error: 'Admin limit reached for your current plan'
            };
        }

        // --- Case 1: User already exists in system ---
        if (existingMember) {
            const companyMember = await prisma.companyMember.findFirst({
                where: { userId: existingMember.id }
            });

            if (!companyMember) {
                return {
                    success: false,
                    data: null,
                    error: 'Error in adding user, please contact support - Error 1021'
                };
            }

            if (companyMember.companyId !== companyId) {
                return {
                    success: false,
                    data: null,
                    error: 'User belongs to a different company, unable to add them'
                };
            }

            if (companyMember.role === 'COMPANY_ADMIN') {
                return {
                    success: false,
                    data: null,
                    error: 'This user is already a company admin'
                };
            }

            const updateAdmin = await prisma.companyMember.update({
                where: { id: companyMember.id },
                data: { role: 'COMPANY_ADMIN' }
            });

            if (!updateAdmin) {
                return {
                    success: false,
                    data: null,
                    error: 'Error in adding user, please contact support - Error 1022'
                };
            }

            const teams = await prisma.team.findMany({
                where: { companyId }
            });

            // Use existingMember.id consistently
            await Promise.all(
                teams.map((team) =>
                    prisma.teamMember.upsert({
                        where: {
                            teamId_userId: {
                                teamId: team.id,
                                userId: existingMember.id
                            }
                        },
                        update: {
                            role: 'TEAM_ADMIN'
                        },
                        create: {
                            teamId: team.id,
                            userId: existingMember.id,
                            role: 'TEAM_ADMIN'
                        }
                    })
                )
            );

            revalidatePath('/company');

            await Promise.all([
                sendCompanyAddedAdminEmail({
                    email: existingMember.email,
                    name: existingMember.name,
                    companyName: company.name
                }),
                logCompanyAdminAdded(user.id, {
                    companyId: company.id,
                    userId: existingMember.id
                })
            ]);

            const members = await fetchCompanyAdminMembers(company.id);

            return {
                success: true,
                data: {
                    method: 'added',
                    members
                },
                error: null
            };
        }

        // --- Case 2: New user, needs invitation ---

        const pendingInvite = await prisma.companyInvite.findFirst({
            where: { companyId, email: data.email }
        });

        if (pendingInvite) {
            return {
                success: false,
                data: null,
                error: 'An invitation has already been sent to this email'
            };
        }

        if (!limits.canCreateUser) {
            return {
                success: false,
                data: null,
                error: 'User limit reached for your current plan'
            };
        }

        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await prisma.companyInvite.create({
            data: {
                email: data.email,
                name: data.name,
                role: 'COMPANY_ADMIN',
                token,
                expiresAt,
                companyId,
                invitedBy: user.id
            }
        });

        const link = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite/company/${token}`;

        await Promise.all([
            sendCompanyInviteAdminEmail({
                email: data.email,
                companyName: company.name,
                link,
                name: data.name,
                expiresAt
            }),
            logCompanyAdminInvited(user.id, {
                companyId: company.id,
                name: data.name,
                email: data.email
            })
        ]);

        const invitations: CompanyInviteRow[] =
            await prisma.companyInvite.findMany({
                where: { companyId: company.id, NOT: { status: 'ACCEPTED' } },
                orderBy: { createdAt: 'asc' }
            });

        revalidatePath('/company');

        return {
            success: true,
            data: {
                method: 'invited',
                invitations
            },
            error: null
        };
    } catch (error) {
        console.error('Failed to invite company member:', error);
        return {
            success: false,
            data: null,
            error: 'Failed to send invitation'
        };
    }
};

/* ------------------------------------------------------------------
 * 👥 Get Company Admin Members
 * ------------------------------------------------------------------ */

export const getCompanyAdminMembers = async (): Promise<
    ActionResult<{ members: CompanyAdminMember[] }>
> => {
    const ctx = await getCompanyContext();

    if (!ctx) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    const { company, userCompany, isAdmin } = ctx;

    if (!isAdmin || !userCompany) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    try {
        const members = await fetchCompanyAdminMembers(company.id);

        return {
            success: true,
            data: { members },
            error: null
        };
    } catch (error) {
        console.error('Failed to fetch company members:', error);
        return {
            success: false,
            data: null,
            error: 'Error fetching members'
        };
    }
};

/* ------------------------------------------------------------------
 * ✉️ Get Pending Company Invitations
 * ------------------------------------------------------------------ */

export const getCompanyInvitations = async (): Promise<
    ActionResult<{ invitations: CompanyInviteRow[] }>
> => {
    const ctx = await getCompanyContext();

    if (!ctx) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    const { company, userCompany, isAdmin } = ctx;

    if (!isAdmin || !userCompany) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    try {
        const invitations: CompanyInviteRow[] =
            await prisma.companyInvite.findMany({
                where: { companyId: company.id, NOT: { status: 'ACCEPTED' } },
                orderBy: { createdAt: 'asc' }
            });

        return {
            success: true,
            data: { invitations },
            error: null
        };
    } catch (error) {
        console.error('Failed to fetch company invitations:', error);
        return {
            success: false,
            data: null,
            error: 'Failed to fetch company invitations'
        };
    }
};

/* ------------------------------------------------------------------
 * ❌ Cancel Company Invitation
 * ------------------------------------------------------------------ */

export const cancelCompanyInvitation = async (
    id: string
): Promise<ActionResult<{ invitations: CompanyInviteRow[] }>> => {
    const ctx = await getCompanyContext();

    if (!ctx) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    const { company, userCompany, isAdmin } = ctx;

    if (!isAdmin || !userCompany) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    try {
        await prisma.companyInvite.delete({ where: { id } });

        const invitations: CompanyInviteRow[] =
            await prisma.companyInvite.findMany({
                where: { companyId: company.id, NOT: { status: 'ACCEPTED' } },
                orderBy: { createdAt: 'asc' }
            });

        revalidatePath('/company');

        return {
            success: true,
            data: { invitations },
            error: null
        };
    } catch (error) {
        console.error('Failed to cancel invitation:', error);
        return {
            success: false,
            data: null,
            error: 'Failed to cancel invitation'
        };
    }
};

/* ------------------------------------------------------------------
 * 🗑️ Remove Company Admin Member (demote to member)
 * ------------------------------------------------------------------ */

export const removeCompanyAdminMember = async (
    memberId: string
): Promise<ActionResult<{ members: CompanyAdminMember[] }>> => {
    const ctx = await getCompanyContext();

    if (!ctx) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    const { company, userCompany, user, isAdmin } = ctx;

    if (!isAdmin || !userCompany) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    try {
        // Prevent removing yourself
        if (memberId === user.id) {
            return {
                success: false,
                data: null,
                error: 'Cannot remove yourself from the company'
            };
        }

        const companyMember = await prisma.companyMember.update({
            where: { id: memberId },
            data: { role: 'COMPANY_MEMBER' }
        });

        // Use companyMember.userId here
        await prisma.teamMember.updateMany({
            where: { userId: companyMember.userId },
            data: { role: 'TEAM_MEMBER' }
        });

        await logCompanyAdminRemoved(user.id, {
            companyId: company.id,
            adminRemoved: memberId
        });

        const members = await fetchCompanyAdminMembers(company.id);

        return {
            success: true,
            data: { members },
            error: null
        };
    } catch (error) {
        console.error('Failed to remove company member:', error);
        return {
            success: false,
            data: null,
            error: 'Failed to remove company member'
        };
    }
};

/* ------------------------------------------------------------------
 * 🔁 Resend Company Invitation
 * ------------------------------------------------------------------ */

export const resendCompanyInvitation = async (
    id: string
): Promise<ActionResult<{ resent: boolean }>> => {
    const ctx = await getCompanyContext();

    if (!ctx) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    const { company, userCompany, isAdmin } = ctx;

    if (!isAdmin || !userCompany) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    try {
        const invite = await prisma.companyInvite.findUnique({ where: { id } });

        if (!invite) {
            return {
                success: false,
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
                success: false,
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

        return {
            success: true,
            data: { resent: true },
            error: null
        };
    } catch (error) {
        console.error('Failed to resend invitation:', error);
        return {
            success: false,
            data: null,
            error: 'Failed to resend invitation'
        };
    }
};

/* ------------------------------------------------------------------
 * 🚫 Deactivate Member
 * ------------------------------------------------------------------ */

export const deactivateMember = async (
    memberId: string
): Promise<ActionResult<{ members: CompanyMemberWithTeams[] }>> => {
    const ctx = await getCompanyContext();

    if (!ctx) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    const { user, company, userCompany, isAdmin } = ctx;

    if (!isAdmin || !userCompany) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    try {
        const memberCompany = await prisma.companyMember.findUnique({
            where: {
                companyId_userId: { companyId: company.id, userId: memberId }
            }
        });

        if (!memberCompany) {
            return {
                success: false,
                data: null,
                error: 'Member not found'
            };
        }

        if (memberCompany.role === 'COMPANY_ADMIN') {
            return {
                success: false,
                data: null,
                error: 'Unable to remove company admin. Please demote them first.'
            };
        }

        // Prevent removing the company creator
        if (company.creatorId === memberId) {
            return {
                success: false,
                data: null,
                error: 'Cannot remove the company creator'
            };
        }

        // Prevent removing yourself
        if (memberId === user.id) {
            return {
                success: false,
                data: null,
                error: 'Cannot remove yourself from the company'
            };
        }

        await prisma.teamMember.deleteMany({
            where: { userId: memberId }
        });

        await prisma.user.update({
            where: { id: memberId },
            data: { status: 'DISABLED' }
        });

        await logCompanyMemberDeactivated(user.id, {
            companyId: company.id,
            memberId
        });

        const members: CompanyMemberWithTeams[] =
            await prisma.companyMember.findMany({
                where: { companyId: company.id },
                include: {
                    user: {
                        include: {
                            teamMembers: { include: { team: true } }
                        }
                    }
                }
            });

        revalidatePath('/team');

        return {
            success: true,
            data: { members },
            error: null
        };
    } catch (error) {
        console.error('Failed to remove team member:', error);
        return {
            success: false,
            data: null,
            error: 'Failed to remove team member'
        };
    }
};

/* ------------------------------------------------------------------
 * ✅ Reactivate Member
 * ------------------------------------------------------------------ */

export const reactivateMember = async (
    memberId: string
): Promise<ActionResult<{ members: CompanyMemberWithTeams[] }>> => {
    const ctx = await getCompanyContext();

    if (!ctx) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    const { user, company, userCompany, isAdmin } = ctx;

    if (!isAdmin || !userCompany) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    try {
        const memberCompany = await prisma.companyMember.findUnique({
            where: {
                companyId_userId: { companyId: company.id, userId: memberId }
            }
        });

        if (!memberCompany) {
            return {
                success: false,
                data: null,
                error: 'Member not found'
            };
        }

        const limits = await checkCompanyUserLimits(company.id);

        if (!limits.canCreateUser) {
            return {
                success: false,
                data: null,
                error: 'User limit reached for your current plan'
            };
        }

        await prisma.user.update({
            where: { id: memberId },
            data: { status: 'ACTIVE' }
        });

        await logCompanyMemberReactivated(user.id, {
            companyId: company.id,
            memberId
        });

        const members: CompanyMemberWithTeams[] =
            await prisma.companyMember.findMany({
                where: { companyId: company.id },
                include: {
                    user: {
                        include: {
                            teamMembers: { include: { team: true } }
                        }
                    }
                }
            });

        revalidatePath('/team');

        return {
            success: true,
            data: { members },
            error: null
        };
    } catch (error) {
        console.error('Failed to reactivate team member:', error);
        return {
            success: false,
            data: null,
            error: 'Failed to reactivate team member'
        };
    }
};

/* ------------------------------------------------------------------
 * 📊 Get Total Active Company Members
 * ------------------------------------------------------------------ */

export const getTotalActiveCompanyMembers = async (): Promise<
    ActionResult<{ total: number }>
> => {
    const ctx = await getCompanyContext();

    if (!ctx) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    const { company } = ctx;

    try {
        const total = await prisma.companyMember.count({
            where: { companyId: company.id, user: { status: 'ACTIVE' } }
        });

        return {
            success: true,
            data: { total },
            error: null
        };
    } catch (error) {
        console.error('Error fetching active company members:', error);
        return {
            success: false,
            data: null,
            error: 'Error fetching active company members'
        };
    }
};
