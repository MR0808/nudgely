'use server';

import * as z from 'zod';
import GithubSlugger from 'github-slugger';

import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';
import { TeamSchema } from '@/schemas/team';
import { checkCompanyLimits, checkTeamPermission } from '@/lib/team';
import { revalidatePath } from 'next/cache';

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

    if (userCompany.role !== 'COMPANY_ADMIN') {
        return {
            data: null,
            error: 'Not authorised'
        };
    }

    try {
        const teams = await prisma.team.findMany({
            where: {
                companyId: company.id
            },
            include: {
                members: { include: { user: true } },
                nudges: true,
                company: { include: { plan: true } }
            }
        });

        const returnTeams = teams.map((team) => {
            const members = team.members;
            const teamAdminCount = members.filter(
                (member) => member.role === 'TEAM_ADMIN'
            ).length;
            return { ...team, admins: teamAdminCount };
        });

        return { data: returnTeams, error: null };
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
            }
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
                slug
            },
            include: {
                company: { include: { plan: true } },
                nudges: { include: { completions: true } }
            }
        });

        if (!team) return null;

        const membership = await checkTeamPermission(user.id, team.id);

        const data = await prisma.teamMember.findMany({
            where: { teamId: team.id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        lastName: true,
                        email: true,
                        image: true
                    }
                }
            },
            orderBy: [
                { role: 'asc' }, // Admins first
                { createdAt: 'asc' }
            ]
        });

        const members = data.map((member) => ({
            id: member.id,
            name: `${member.user.name} ${member.user.lastName}`.trim(),
            email: member.user.email,
            role: member.role,
            avatar: member.user.image || undefined,
            joinedAt: member.createdAt,
            isCurrentUser: member.user.id === user.id
        }));

        return { team, members, userRole: membership.role };
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

    const { user } = userSession;

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
                        nudges: true
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

// export async function inviteTeamMember(data: {
//     teamId: string;
//     email: string;
//     role: 'TEAM_ADMIN' | 'TEAM_MEMBER';
// }) {
//     const userSession = await authCheckServer();

//     if (!userSession) {
//         return {
//             data: null,
//             message: 'Not authorised'
//         };
//     }

//     const { user } = userSession;

//     try {
//         // Validate input
//         if (!data.email?.trim()) {
//             return { success: false, error: 'Email is required' };
//         }

//         if (!data.email.includes('@')) {
//             return {
//                 success: false,
//                 error: 'Please enter a valid email address'
//             };
//         }

//         // Check team permissions - only team admins can invite
//         const membership = await checkTeamPermission(
//             user.id,
//             data.teamId,
//             'TEAM_ADMIN'
//         );

//         // Check if user is already a team member
//         const existingMember = await prisma.teamMember.findFirst({
//             where: {
//                 teamId: data.teamId,
//                 user: {
//                     email: data.email.toLowerCase().trim()
//                 }
//             }
//         });

//         if (existingMember) {
//             return {
//                 success: false,
//                 error: 'This user is already a team member'
//             };
//         }

//         // Check if there's already a pending invitation
//         const existingInvite = await prisma.teamInvite.findFirst({
//             where: {
//                 teamId: data.teamId,
//                 email: data.email.toLowerCase().trim(),
//                 status: 'PENDING'
//             }
//         });

//         if (existingInvite) {
//             return {
//                 success: false,
//                 error: 'An invitation has already been sent to this email'
//             };
//         }

//         // Check company plan limits
//         const team = await prisma.team.findUnique({
//             where: { id: data.teamId },
//             include: {
//                 company: true,
//                 members: true
//             }
//         });

//         if (!team) {
//             return { success: false, error: 'Team not found' };
//         }

//         // Free plan: max 3 members per team
//         if (team.company.plan === 'FREE' && team.members.length >= 3) {
//             return {
//                 success: false,
//                 error: 'Free plan is limited to 3 members per team. Upgrade to Pro for unlimited members.'
//             };
//         }

//         // Generate secure invitation token
//         const token = randomBytes(32).toString('hex');
//         const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

//         // Create the invitation
//         const invite = await prisma.teamInvite.create({
//             data: {
//                 teamId: data.teamId,
//                 email: data.email.toLowerCase().trim(),
//                 role: data.role,
//                 token,
//                 expiresAt,
//                 invitedBy: user.id
//             }
//         });

//         const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`;

//         const emailResult = await sendTeamInvitationEmail({
//             invitedEmail: data.email.toLowerCase().trim(),
//             inviterName: `${user.name} ${user.lastName}`.trim(),
//             teamName: team.name,
//             companyName: team.company.name,
//             role: data.role,
//             inviteUrl,
//             expiresAt
//         });

//         if (!emailResult.success) {
//             // If email fails, delete the invitation and return error
//             await prisma.teamInvite.delete({ where: { id: invite.id } });
//             return { success: false, error: 'Failed to send invitation email' };
//         }

//         // Create audit log
//         await prisma.auditLog.create({
//             data: {
//                 userId: user.id,
//                 companyId: team.companyId,
//                 teamId: data.teamId,
//                 action: 'TEAM_MEMBER_INVITED',
//                 category: 'team',
//                 description: `Invited ${data.email} to join team as ${data.role}`,
//                 metadata: {
//                     invitedEmail: data.email,
//                     role: data.role,
//                     inviteId: invite.id,
//                     emailMessageId: emailResult.messageId
//                 }
//             }
//         });

//         return { success: true, inviteId: invite.id, token };
//     } catch (error) {
//         console.error('Failed to invite team member:', error);
//         return { success: false, error: 'Failed to send invitation' };
//     }
// }

// export async function getTeamInvitations(teamId: string) {
//     try {
//         const user = await getCurrentUser();

//         // Check team permissions - only admins can view invitations
//         await checkTeamPermission(user.id, teamId, 'TEAM_ADMIN');

//         const invitations = await prisma.teamInvite.findMany({
//             where: { teamId },
//             include: {
//                 team: {
//                     select: {
//                         name: true
//                     }
//                 }
//             },
//             orderBy: { createdAt: 'desc' }
//         });

//         return invitations.map((invite) => ({
//             id: invite.id,
//             email: invite.email,
//             role: invite.role,
//             status: invite.status,
//             expiresAt: invite.expiresAt,
//             createdAt: invite.createdAt,
//             teamName: invite.team.name
//         }));
//     } catch (error) {
//         console.error('Failed to fetch team invitations:', error);
//         return null;
//     }
// }

// export async function cancelTeamInvitation(inviteId: string) {
//     try {
//         const user = await getCurrentUser();

//         // Get the invitation
//         const invite = await prisma.teamInvite.findUnique({
//             where: { id: inviteId },
//             include: { team: true }
//         });

//         if (!invite) {
//             return { success: false, error: 'Invitation not found' };
//         }

//         // Check team permissions
//         await checkTeamPermission(user.id, invite.teamId, 'TEAM_ADMIN');

//         // Delete the invitation
//         await prisma.teamInvite.delete({
//             where: { id: inviteId }
//         });

//         // Create audit log
//         await prisma.auditLog.create({
//             data: {
//                 userId: user.id,
//                 companyId: invite.team.companyId,
//                 teamId: invite.teamId,
//                 action: 'TEAM_INVITATION_CANCELLED',
//                 category: 'team',
//                 description: `Cancelled invitation for ${invite.email}`,
//                 metadata: {
//                     invitedEmail: invite.email,
//                     role: invite.role
//                 }
//             }
//         });

//         return { success: true };
//     } catch (error) {
//         console.error('Failed to cancel invitation:', error);
//         return { success: false, error: 'Failed to cancel invitation' };
//     }
// }

// export async function removeTeamMember(memberId: string) {
//     try {
//         const user = await getCurrentUser();

//         // Get the member
//         const member = await prisma.teamMember.findUnique({
//             where: { id: memberId },
//             include: {
//                 team: true,
//                 user: true
//             }
//         });

//         if (!member) {
//             return { success: false, error: 'Team member not found' };
//         }

//         // Check team permissions
//         await checkTeamPermission(user.id, member.teamId, 'TEAM_ADMIN');

//         // Prevent removing the team creator
//         if (member.team.creatorId === member.userId) {
//             return { success: false, error: 'Cannot remove the team creator' };
//         }

//         // Prevent removing yourself
//         if (member.userId === user.id) {
//             return {
//                 success: false,
//                 error: 'Cannot remove yourself from the team'
//             };
//         }

//         // Remove the member
//         await prisma.teamMember.delete({
//             where: { id: memberId }
//         });

//         // Create audit log
//         await prisma.auditLog.create({
//             data: {
//                 userId: user.id,
//                 companyId: member.team.companyId,
//                 teamId: member.teamId,
//                 action: 'TEAM_MEMBER_REMOVED',
//                 category: 'team',
//                 description: `Removed ${member.user.name} ${member.user.lastName} from team`,
//                 metadata: {
//                     removedUserId: member.userId,
//                     removedUserEmail: member.user.email,
//                     removedUserName: `${member.user.name} ${member.user.lastName}`
//                 }
//             }
//         });

//         return { success: true };
//     } catch (error) {
//         console.error('Failed to remove team member:', error);
//         return { success: false, error: 'Failed to remove team member' };
//     }
// }

// export async function changeTeamMemberRole(
//     memberId: string,
//     newRole: 'TEAM_ADMIN' | 'TEAM_MEMBER'
// ) {
//     try {
//         const user = await getCurrentUser();

//         // Get the member
//         const member = await prisma.teamMember.findUnique({
//             where: { id: memberId },
//             include: {
//                 team: true,
//                 user: true
//             }
//         });

//         if (!member) {
//             return { success: false, error: 'Team member not found' };
//         }

//         // Check team permissions
//         await checkTeamPermission(user.id, member.teamId, 'TEAM_ADMIN');

//         // Prevent changing the team creator's role
//         if (member.team.creatorId === member.userId) {
//             return {
//                 success: false,
//                 error: "Cannot change the team creator's role"
//             };
//         }

//         // Update the role
//         await prisma.teamMember.update({
//             where: { id: memberId },
//             data: { role: newRole }
//         });

//         // Create audit log
//         await prisma.auditLog.create({
//             data: {
//                 userId: user.id,
//                 companyId: member.team.companyId,
//                 teamId: member.teamId,
//                 action: 'TEAM_MEMBER_ROLE_CHANGED',
//                 category: 'team',
//                 description: `Changed ${member.user.name} ${member.user.lastName}'s role to ${newRole}`,
//                 metadata: {
//                     targetUserId: member.userId,
//                     targetUserEmail: member.user.email,
//                     oldRole: member.role,
//                     newRole
//                 }
//             }
//         });

//         return { success: true };
//     } catch (error) {
//         console.error('Failed to change team member role:', error);
//         return { success: false, error: 'Failed to change member role' };
//     }
// }
