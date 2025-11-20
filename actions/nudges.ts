'use server';

import * as z from 'zod';
import GithubSlugger from 'github-slugger';
import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';
import { CreateNudgeSchema } from '@/schemas/nudge';
import {
    logNudgePaused,
    logNudgeResumed,
    logNudgeUpdated
} from '@/actions/audit/audit-nudge';
import type { Prisma } from '@/generated/prisma';

/* ------------------------------------------------------------------
 * 🧩 Types
 * ------------------------------------------------------------------ */

const slugger = new GithubSlugger();

type FieldErrors = Record<string, string[]>;

type ActionSuccess<T> = {
    success: true;
    data: T;
};

type ActionFailure = {
    success: false;
    error: string;
    fieldErrors?: FieldErrors;
};

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

// Prisma payload helpers
type NudgeWithTeam = Prisma.NudgeGetPayload<{
    include: { team: true };
}>;

type NudgeWithTeamAndRecipients = Prisma.NudgeGetPayload<{
    include: { team: true; recipients: true };
}>;

type NudgeWithInstances = Prisma.NudgeGetPayload<{
    include: {
        recipients: true;
        team: true;
        instances: {
            include: {
                events: true;
                completion: {
                    include: {
                        user: true;
                    };
                };
            };
        };
    };
}>;

/* ------------------------------------------------------------------
 * 🔢 Simple count helpers (internal-style)
 * ------------------------------------------------------------------ */

export const getCompanyNudgeCount = async (): Promise<number> => {
    const userSession = await authCheckServer();

    if (!userSession) {
        throw new Error('Not authorised');
    }

    const { company, userCompany } = userSession;

    if (userCompany.role !== 'COMPANY_ADMIN') {
        throw new Error('Not authorised');
    }

    try {
        const companyWithNudges = await prisma.company.findUnique({
            where: {
                id: company.id
            },
            include: {
                teams: {
                    include: {
                        nudges: true
                    }
                }
            }
        });

        if (!companyWithNudges) {
            throw new Error('Company not found');
        }

        // Sum the number of nudges across all teams
        const nudgeCount = companyWithNudges.teams.reduce(
            (total, team) => total + team.nudges.length,
            0
        );

        return nudgeCount;
    } catch (error) {
        console.error('Error fetching nudge count:', error);
        throw error;
    }
};

export const getTotalCompanyNudges = async (): Promise<number> => {
    const userSession = await authCheckServer();

    if (!userSession) {
        throw new Error('Not authorised');
    }

    const { company } = userSession;

    try {
        const nudges = await prisma.nudge.findMany({
            where: { team: { companyId: company.id } }
        });

        return nudges.length;
    } catch (error) {
        console.error('Error fetching total company nudges:', error);
        throw new Error(`Error fetching nudge count: ${error}`);
    }
};

/* ------------------------------------------------------------------
 * 📋 Get Team Nudges
 * ------------------------------------------------------------------ */

type GetTeamNudgesData = {
    nudges: NudgeWithTeamAndRecipients[];
};

export const getTeamNudges = async (
    teamId: string
): Promise<ActionResult<GetTeamNudgesData>> => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            success: false,
            error: 'Not authorised'
        };
    }

    const { company } = userSession;

    try {
        const where =
            teamId === 'all' ? { team: { companyId: company.id } } : { teamId };

        const nudges = await prisma.nudge.findMany({
            where,
            include: {
                recipients: true,
                team: true
            }
        });

        return {
            success: true,
            data: { nudges }
        };
    } catch (error) {
        console.error('Error fetching nudges:', error);
        return {
            success: false,
            error: 'Error fetching nudges'
        };
    }
};

/* ------------------------------------------------------------------
 * ➕ Create Nudge
 * ------------------------------------------------------------------ */

type CreateNudgeData = {
    nudge: NudgeWithTeam;
};

export const createNudge = async (
    values: z.infer<typeof CreateNudgeSchema>
): Promise<ActionResult<CreateNudgeData>> => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            success: false,
            error: 'Not authorised'
        };
    }

    const { user, company } = userSession;

    try {
        const plan = await prisma.plan.findUnique({
            where: { id: company.planId }
        });

        if (!plan) {
            return {
                success: false,
                error: 'No plan found',
                fieldErrors: {
                    plan: ['Not found']
                }
            };
        }

        const nudgesForCompany = await prisma.nudge.findMany({
            where: { team: { companyId: company.id } }
        });

        if (plan.maxNudges > 0 && nudgesForCompany.length >= plan.maxNudges) {
            return {
                success: false,
                error: 'Nudges limit reached',
                fieldErrors: {
                    nudges: [
                        'You have created the maximum number of nudges allowed on your plan.'
                    ]
                }
            };
        }

        const validatedFields = CreateNudgeSchema.safeParse(values);

        if (!validatedFields.success) {
            const { fieldErrors } = validatedFields.error.flatten();

            return {
                success: false,
                error: 'Validation failed',
                fieldErrors
            };
        }

        const validatedData = validatedFields.data;

        const teamMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: validatedData.teamId,
                    userId: user.id
                }
            }
        });

        if (!teamMember) {
            return {
                success: false,
                error: 'Not part of the team',
                fieldErrors: {
                    teamId: ['User is not part of this team']
                }
            };
        }

        // Check if end date is in the future (if provided)
        if (validatedData.endType === 'ON_DATE' && validatedData.endDate) {
            const endDate = new Date(validatedData.endDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (endDate < today) {
                return {
                    success: false,
                    error: 'End date must be in the future',
                    fieldErrors: {
                        endDate: ['End date must be in the future']
                    }
                };
            }
        }

        // Deduplicate recipient emails
        const emailSet = new Set<string>();
        const recipients: { email: string; firstName: string }[] = [];

        for (const recipient of validatedData.recipients) {
            const email = recipient.email.toLowerCase();
            if (!emailSet.has(email)) {
                recipients.push({
                    email,
                    firstName: recipient.name
                });
                emailSet.add(email);
            }
        }

        if (recipients.length === 0) {
            return {
                success: false,
                error: 'No recipients set',
                fieldErrors: {
                    recipients: ['At least one recipient is required']
                }
            };
        }

        if (plan.maxRecipients > 0 && recipients.length > plan.maxRecipients) {
            return {
                success: false,
                error: 'Too many recipients',
                fieldErrors: {
                    recipients: [
                        'You have gone over the number of recipients allowed on your plan'
                    ]
                }
            };
        }

        // Reasonable interval guard
        if (validatedData.interval > 365) {
            return {
                success: false,
                error: 'Interval cannot exceed 365',
                fieldErrors: {
                    interval: ['Interval is too large']
                }
            };
        }

        // Generate unique slug
        let slug = slugger.slug(validatedData.name);
        let slugExists = true;

        while (slugExists) {
            const existing = await prisma.nudge.findUnique({
                where: { slug }
            });
            if (!existing) {
                slugExists = false;
            } else {
                slug = slugger.slug(validatedData.name);
            }
        }

        const nudge = await prisma.nudge.create({
            data: {
                slug,
                name: validatedData.name,
                description: validatedData.description || null,
                teamId: validatedData.teamId,
                frequency: validatedData.frequency,
                interval: validatedData.interval,
                dayOfWeek:
                    validatedData.frequency === 'WEEKLY'
                        ? validatedData.dayOfWeek
                        : null,
                monthlyType:
                    validatedData.frequency === 'MONTHLY'
                        ? validatedData.monthlyType
                        : null,
                dayOfMonth:
                    validatedData.frequency === 'MONTHLY' &&
                    validatedData.monthlyType === 'DAY_OF_MONTH'
                        ? validatedData.dayOfMonth
                        : null,
                nthOccurrence:
                    validatedData.frequency === 'MONTHLY' &&
                    validatedData.monthlyType === 'NTH_DAY_OF_WEEK'
                        ? validatedData.nthOccurrence
                        : null,
                dayOfWeekForMonthly:
                    validatedData.frequency === 'MONTHLY' &&
                    validatedData.monthlyType === 'NTH_DAY_OF_WEEK'
                        ? validatedData.dayOfWeekForMonthly
                        : null,
                timeOfDay: validatedData.timeOfDay,
                timezone: validatedData.timezone,
                endType: validatedData.endType,
                endDate:
                    validatedData.endType === 'ON_DATE' && validatedData.endDate
                        ? new Date(validatedData.endDate)
                        : null,
                endAfterOccurrences:
                    validatedData.endType === 'AFTER_OCCURRENCES'
                        ? validatedData.endAfterOccurrences
                        : null,
                creatorId: user.id
            },
            include: {
                team: true
            }
        });

        // Create recipients
        for (const recipient of recipients) {
            let userId: string | null = null;
            const recipientUser = await prisma.user.findUnique({
                where: { email: recipient.email }
            });
            if (recipientUser) {
                userId = recipientUser.id;
            }

            await prisma.nudgeRecipient.create({
                data: {
                    name: recipient.firstName,
                    email: recipient.email,
                    userId,
                    nudgeId: nudge.id
                }
            });
        }

        return {
            success: true,
            data: { nudge }
        };
    } catch (error) {
        console.error('Error creating nudge:', error);

        if (error instanceof Error) {
            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: false,
            error: 'An unexpected error occurred while creating the reminder'
        };
    }
};

/* ------------------------------------------------------------------
 * ✏️ Update Nudge
 * ------------------------------------------------------------------ */

type UpdateNudgeData = {
    nudge: NudgeWithTeamAndRecipients;
};

export const updateNudge = async (
    values: z.infer<typeof CreateNudgeSchema>,
    nudgeId: string
): Promise<ActionResult<UpdateNudgeData>> => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            success: false,
            error: 'Not authorised'
        };
    }

    const { user, company } = userSession;

    try {
        const plan = await prisma.plan.findUnique({
            where: { id: company.planId }
        });

        if (!plan) {
            return {
                success: false,
                error: 'No plan found',
                fieldErrors: {
                    plan: ['Not found']
                }
            };
        }

        const validatedFields = CreateNudgeSchema.safeParse(values);

        if (!validatedFields.success) {
            const { fieldErrors } = validatedFields.error.flatten();

            return {
                success: false,
                error: 'Validation failed',
                fieldErrors
            };
        }

        const validatedData = validatedFields.data;

        const teamMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: validatedData.teamId,
                    userId: user.id
                }
            }
        });

        if (!teamMember) {
            return {
                success: false,
                error: 'Not part of the team',
                fieldErrors: {
                    teamId: ['User is not part of this team']
                }
            };
        }

        const oldNudge = await prisma.nudge.findUnique({
            where: { id: nudgeId },
            include: { team: true, recipients: true }
        });

        if (!oldNudge) {
            return {
                success: false,
                error: 'Nudge not found',
                fieldErrors: {
                    nudgeId: ['Nudge not found']
                }
            };
        }

        // End date validation
        if (validatedData.endType === 'ON_DATE' && validatedData.endDate) {
            const endDate = new Date(validatedData.endDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (endDate < today) {
                return {
                    success: false,
                    error: 'End date must be in the future',
                    fieldErrors: {
                        endDate: ['End date must be in the future']
                    }
                };
            }
        }

        // Deduplicate recipients
        const emailSet = new Set<string>();
        const recipients: { email: string; firstName: string }[] = [];

        for (const recipient of validatedData.recipients) {
            const email = recipient.email.toLowerCase();
            if (!emailSet.has(email)) {
                recipients.push({
                    email,
                    firstName: recipient.name
                });
                emailSet.add(email);
            }
        }

        if (recipients.length === 0) {
            return {
                success: false,
                error: 'No recipients set',
                fieldErrors: {
                    recipients: ['At least one recipient is required']
                }
            };
        }

        if (plan.maxRecipients > 0 && recipients.length > plan.maxRecipients) {
            return {
                success: false,
                error: 'Too many recipients',
                fieldErrors: {
                    recipients: [
                        'You have gone over the number of recipients allowed on your plan'
                    ]
                }
            };
        }

        // Reasonable interval guard
        if (validatedData.interval > 365) {
            return {
                success: false,
                error: 'Interval cannot exceed 365',
                fieldErrors: {
                    interval: ['Interval is too large']
                }
            };
        }

        // Slug handling
        let slug = oldNudge.slug;

        if (validatedData.name !== oldNudge.name) {
            slug = slugger.slug(validatedData.name);
            let slugExists = true;

            while (slugExists) {
                const existing = await prisma.nudge.findUnique({
                    where: { slug }
                });
                if (!existing) {
                    slugExists = false;
                } else {
                    slug = slugger.slug(validatedData.name);
                }
            }
        }

        const nudge = await prisma.nudge.update({
            where: { id: nudgeId },
            data: {
                slug,
                name: validatedData.name,
                description: validatedData.description || null,
                teamId: validatedData.teamId,
                frequency: validatedData.frequency,
                interval: validatedData.interval,
                dayOfWeek:
                    validatedData.frequency === 'WEEKLY'
                        ? validatedData.dayOfWeek
                        : null,
                monthlyType:
                    validatedData.frequency === 'MONTHLY'
                        ? validatedData.monthlyType
                        : null,
                dayOfMonth:
                    validatedData.frequency === 'MONTHLY' &&
                    validatedData.monthlyType === 'DAY_OF_MONTH'
                        ? validatedData.dayOfMonth
                        : null,
                nthOccurrence:
                    validatedData.frequency === 'MONTHLY' &&
                    validatedData.monthlyType === 'NTH_DAY_OF_WEEK'
                        ? validatedData.nthOccurrence
                        : null,
                dayOfWeekForMonthly:
                    validatedData.frequency === 'MONTHLY' &&
                    validatedData.monthlyType === 'NTH_DAY_OF_WEEK'
                        ? validatedData.dayOfWeekForMonthly
                        : null,
                timeOfDay: validatedData.timeOfDay,
                timezone: validatedData.timezone,
                endType: validatedData.endType,
                endDate:
                    validatedData.endType === 'ON_DATE' && validatedData.endDate
                        ? new Date(validatedData.endDate)
                        : null,
                endAfterOccurrences:
                    validatedData.endType === 'AFTER_OCCURRENCES'
                        ? validatedData.endAfterOccurrences
                        : null,
                creatorId: user.id
            },
            include: {
                team: true,
                recipients: true
            }
        });

        // Sync recipients
        const currentRecipients = nudge.recipients;
        const submittedRecipients = validatedData.recipients;

        const submittedEmails = new Set(
            submittedRecipients.map((r) => r.email)
        );
        const currentEmails = new Set(currentRecipients.map((r) => r.email));

        // Recipients to delete (in DB but not in submitted)
        const recipientsToDelete = currentRecipients.filter(
            (r) => !submittedEmails.has(r.email)
        );

        if (recipientsToDelete.length > 0) {
            await prisma.nudgeRecipient.deleteMany({
                where: {
                    nudgeId,
                    email: {
                        in: recipientsToDelete.map((r) => r.email)
                    }
                }
            });
        }

        // Recipients to add (in submitted but not in DB)
        const recipientsToAdd = submittedRecipients.filter(
            (r) => !currentEmails.has(r.email)
        );

        if (recipientsToAdd.length > 0) {
            const newRecipients: {
                name: string;
                email: string;
                userId: string | null;
            }[] = [];

            for (const recipient of recipientsToAdd) {
                let userId: string | null = null;
                const recipientUser = await prisma.user.findUnique({
                    where: { email: recipient.email }
                });
                if (recipientUser) {
                    userId = recipientUser.id;
                }
                newRecipients.push({
                    name: recipient.name,
                    email: recipient.email,
                    userId
                });
            }

            await prisma.nudgeRecipient.createMany({
                data: newRecipients.map((recipient) => ({
                    nudgeId,
                    name: recipient.name,
                    email: recipient.email,
                    userId: recipient.userId
                }))
            });
        }

        await logNudgeUpdated(userSession.user.id, {
            nudgeId: nudge.id,
            nudge: nudge.name,
            oldNudge,
            slug,
            name: validatedData.name,
            description: validatedData.description || null,
            teamId: validatedData.teamId,
            frequency: validatedData.frequency,
            interval: validatedData.interval,
            dayOfWeek:
                validatedData.frequency === 'WEEKLY'
                    ? validatedData.dayOfWeek
                    : null,
            monthlyType:
                validatedData.frequency === 'MONTHLY'
                    ? validatedData.monthlyType
                    : null,
            dayOfMonth:
                validatedData.frequency === 'MONTHLY' &&
                validatedData.monthlyType === 'DAY_OF_MONTH'
                    ? validatedData.dayOfMonth
                    : null,
            nthOccurrence:
                validatedData.frequency === 'MONTHLY' &&
                validatedData.monthlyType === 'NTH_DAY_OF_WEEK'
                    ? validatedData.nthOccurrence
                    : null,
            dayOfWeekForMonthly:
                validatedData.frequency === 'MONTHLY' &&
                validatedData.monthlyType === 'NTH_DAY_OF_WEEK'
                    ? validatedData.dayOfWeekForMonthly
                    : null,
            timeOfDay: validatedData.timeOfDay,
            timezone: validatedData.timezone,
            endType: validatedData.endType,
            endDate:
                validatedData.endType === 'ON_DATE' && validatedData.endDate
                    ? new Date(validatedData.endDate)
                    : null,
            endAfterOccurrences:
                validatedData.endType === 'AFTER_OCCURRENCES'
                    ? validatedData.endAfterOccurrences
                    : null,
            creatorId: user.id
        });

        revalidatePath(`/nudges/${slug}`);

        return {
            success: true,
            data: { nudge }
        };
    } catch (error) {
        console.error('Error updating nudge:', error);

        if (error instanceof Error) {
            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: false,
            error: 'An unexpected error occurred while updating the reminder'
        };
    }
};

/* ------------------------------------------------------------------
 * ⏸️ Pause Nudge
 * ------------------------------------------------------------------ */

type PauseResumeData = {
    nudges: NudgeWithTeamAndRecipients[];
};

export const pauseNudge = async (
    id: string
): Promise<ActionResult<PauseResumeData>> => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            success: false,
            error: 'Not authorised'
        };
    }

    try {
        const nudge = await prisma.nudge.update({
            where: { id },
            data: { status: 'PAUSED' }
        });

        await logNudgePaused(userSession.user.id, {
            nudgeId: nudge.id
        });

        const nudges = await prisma.nudge.findMany({
            where: { teamId: nudge.teamId },
            include: { recipients: true, team: true }
        });

        revalidatePath(`/nudges/${nudge.slug}`);

        return {
            success: true,
            data: { nudges }
        };
    } catch (error) {
        console.error('Error pausing nudge:', error);

        if (error instanceof Error) {
            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: false,
            error: 'An unexpected error occurred while pausing the reminder'
        };
    }
};

/* ------------------------------------------------------------------
 * ▶️ Resume Nudge
 * ------------------------------------------------------------------ */

export const resumeNudge = async (
    id: string
): Promise<ActionResult<PauseResumeData>> => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            success: false,
            error: 'Not authorised'
        };
    }

    try {
        const nudge = await prisma.nudge.update({
            where: { id },
            data: { status: 'ACTIVE' }
        });

        await logNudgeResumed(userSession.user.id, {
            nudgeId: nudge.id
        });

        const nudges = await prisma.nudge.findMany({
            where: { teamId: nudge.teamId },
            include: { recipients: true, team: true }
        });

        revalidatePath(`/nudges/${nudge.slug}`);

        return {
            success: true,
            data: { nudges }
        };
    } catch (error) {
        console.error('Error resuming nudge:', error);

        if (error instanceof Error) {
            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: false,
            error: 'An unexpected error occurred while resuming the reminder'
        };
    }
};

/* ------------------------------------------------------------------
 * 🔍 Get Nudge by Slug (detail page)
 * ------------------------------------------------------------------ */

type GetNudgeBySlugData = {
    nudge: NudgeWithInstances;
};

export const getNudgeBySlug = async (
    slug: string
): Promise<ActionResult<GetNudgeBySlugData>> => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            success: false,
            error: 'Not authorised'
        };
    }

    try {
        const nudge = await prisma.nudge.findUnique({
            where: {
                slug
            },
            include: {
                recipients: true,
                team: true,
                instances: {
                    include: {
                        events: true,
                        completion: {
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }
        });

        if (!nudge) {
            return {
                success: false,
                error: 'Nudge not found'
            };
        }

        return {
            success: true,
            data: { nudge }
        };
    } catch (error) {
        console.error('Error fetching nudge by slug:', error);

        return {
            success: false,
            error: 'Failed to load nudge'
        };
    }
};
