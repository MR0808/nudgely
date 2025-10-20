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

const slugger = new GithubSlugger();

export const getCompanyNudgeCount = async () => {
    const userSession = await authCheckServer();

    if (!userSession) {
        throw new Error('Not authorised');
    }

    const { user, company, userCompany } = userSession;

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
        const nudgeCount = companyWithNudges.teams.reduce((total, team) => {
            return total + team.nudges.length;
        }, 0);

        return nudgeCount;
    } catch (error) {
        console.error('Error fetching nudge count:', error);
        throw error;
    }
};

export const getTotalCompanyNudges = async () => {
    const userSession = await authCheckServer();

    if (!userSession) {
        throw new Error('Not authorised');
    }

    const { user, company, userCompany } = userSession;
    try {
        const nudges = await prisma.nudge.findMany({
            where: { team: { companyId: company.id } }
        });

        return nudges.length;
    } catch (error) {
        throw new Error(`Error fetching nudge count: ${error}`);
    }
};

export const getTeamNudges = async (teamId: string) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        throw new Error('Not authorised');
    }

    const { user, company, userCompany } = userSession;
    try {
        if (teamId === 'all') {
            const nudges = await prisma.nudge.findMany({
                where: { team: { companyId: company.id } },
                include: { recipients: true, team: true }
            });
            return nudges;
        } else {
            const nudges = await prisma.nudge.findMany({
                where: { teamId },
                include: { recipients: true, team: true }
            });
            return nudges;
        }
    } catch (error) {
        console.error('Error fetching nudge count:', error);
    }
};

export const createNudge = async (
    values: z.infer<typeof CreateNudgeSchema>
) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        throw new Error('Not authorised');
    }

    const { user, company, userCompany } = userSession;
    try {
        const plan = await prisma.plan.findUnique({
            where: { id: company.planId }
        });

        if (!plan) {
            return {
                success: false,
                error: 'No plan found ',
                fieldErrors: {
                    plan: ['Not found']
                }
            };
        }

        const nudges = await prisma.nudge.findMany({
            where: { team: { companyId: company.id } }
        });

        if (plan.maxNudges > 0 && nudges.length >= plan.maxNudges) {
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
            // const errors = validatedFields.error.flatten().fieldErrors;
            const errors = z.flattenError(validatedFields.error);

            return {
                success: false,
                error: 'Validation failed',
                fieldErrors: errors.fieldErrors
            };
        }

        const validatedData = validatedFields.data;

        const teamMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: { teamId: validatedData.teamId, userId: user.id }
            }
        });

        if (!teamMember) {
            return {
                success: false,
                error: 'Not part of the team',
                fieldErrors: { teamId: ['User is not part of this team'] }
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
                    fieldErrors: { endDate: ['End date must be in the future'] }
                };
            }
        }

        // Check for duplicate recipient emails
        const emailSet = new Set<string>();
        const recipients: { email: string; firstName: string }[] = [];

        for (const recipient of validatedData.recipients) {
            const email = recipient.email.toLowerCase();
            if (!emailSet.has(email)) {
                recipients.push({
                    email: recipient.email.toLowerCase(),
                    firstName: recipient.name
                });
            }
            emailSet.add(email);
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

        // Validate interval is reasonable (prevent extremely large intervals)
        if (validatedData.interval > 365) {
            return {
                success: false,
                error: 'Interval cannot exceed 365',
                fieldErrors: { interval: ['Interval is too large'] }
            };
        }

        let slug = slugger.slug(validatedData.name);
        let slugExists = true;

        while (slugExists) {
            const checkSlug = await prisma.nudge.findUnique({
                where: { slug }
            });
            if (!checkSlug) {
                slugExists = false;
                break;
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

        for (const recipient of recipients) {
            let userId: string | null = null;
            const recipientUser = await prisma.user.findUnique({
                where: { email: recipient.email }
            });
            if (recipientUser) userId = recipientUser.id;
            await prisma.nudgeRecipient.create({
                data: {
                    name: recipient.firstName,
                    email: recipient.email,
                    userId,
                    nudgeId: nudge.id
                }
            });
        }

        return { success: true, nudge };
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

export const updateNudge = async (
    values: z.infer<typeof CreateNudgeSchema>,
    nudgeId: string
) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        throw new Error('Not authorised');
    }

    const { user, company, userCompany } = userSession;
    try {
        const plan = await prisma.plan.findUnique({
            where: { id: company.planId }
        });

        if (!plan) {
            return {
                success: false,
                error: 'No plan found ',
                fieldErrors: {
                    plan: ['Not found']
                }
            };
        }

        const validatedFields = CreateNudgeSchema.safeParse(values);

        if (!validatedFields.success) {
            // const errors = validatedFields.error.flatten().fieldErrors;
            const errors = z.flattenError(validatedFields.error);

            return {
                success: false,
                error: 'Validation failed',
                fieldErrors: errors.fieldErrors
            };
        }

        const validatedData = validatedFields.data;

        const teamMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: { teamId: validatedData.teamId, userId: user.id }
            }
        });

        if (!teamMember) {
            return {
                success: false,
                error: 'Not part of the team',
                fieldErrors: { teamId: ['User is not part of this team'] }
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
                fieldErrors: { nudgeId: ['Nudge not found'] }
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
                    fieldErrors: { endDate: ['End date must be in the future'] }
                };
            }
        }

        // Check for duplicate recipient emails
        const emailSet = new Set<string>();
        const recipients: { email: string; firstName: string }[] = [];

        for (const recipient of validatedData.recipients) {
            const email = recipient.email.toLowerCase();
            if (!emailSet.has(email)) {
                recipients.push({
                    email: recipient.email.toLowerCase(),
                    firstName: recipient.name
                });
            }
            emailSet.add(email);
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

        // Validate interval is reasonable (prevent extremely large intervals)
        if (validatedData.interval > 365) {
            return {
                success: false,
                error: 'Interval cannot exceed 365',
                fieldErrors: { interval: ['Interval is too large'] }
            };
        }

        let slug = oldNudge.slug;

        if (validatedData.name !== oldNudge.name) {
            slug = slugger.slug(validatedData.name);
            let slugExists = true;

            while (slugExists) {
                const checkSlug = await prisma.nudge.findUnique({
                    where: { slug }
                });
                if (!checkSlug) {
                    slugExists = false;
                    break;
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

        // Get current recipients from the database
        const currentRecipients = nudge.recipients;
        const submittedRecipients = validatedData.recipients;

        // Identify emails in the submitted form and current database
        const submittedEmails = new Set(
            submittedRecipients.map((r) => r.email)
        );
        const currentEmails = new Set(currentRecipients.map((r) => r.email));

        // Determine recipients to delete (in DB but not in form)
        const recipientsToDelete = currentRecipients.filter(
            (r) => !submittedEmails.has(r.email)
        );

        // Determine recipients to add (in form but not in DB)
        const recipientsToAdd = submittedRecipients.filter(
            (r) => !currentEmails.has(r.email)
        );

        // Delete removed recipients
        if (recipientsToDelete.length > 0) {
            await prisma.nudgeRecipient.deleteMany({
                where: {
                    nudgeId,
                    email: { in: recipientsToDelete.map((r) => r.email) }
                }
            });
        }

        // Add new recipients
        if (recipientsToAdd.length > 0) {
            let newRecipients: {
                name: string;
                email: string;
                userId: string | null;
            }[] = [];
            for (const recipient of recipientsToAdd) {
                let userId: string | null = null;
                const recipientUser = await prisma.user.findUnique({
                    where: { email: recipient.email }
                });
                if (recipientUser) userId = recipientUser.id;
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

        return { success: true, nudge };
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

export const pauseNudge = async (id: string) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        throw new Error('Not authorised');
    }

    try {
        const nudge = await prisma.nudge.update({
            where: { id },
            data: { status: 'PAUSED' }
        });

        await logNudgePaused(userSession.user.id, {
            nudgeId: nudge.id
        });

        const nudges = await getTeamNudges(nudge.teamId);

        revalidatePath(`/nudges/${nudge.slug}`);

        return {
            data: nudges,
            error: null
        };
    } catch (error) {
        if (error instanceof Error) {
            return {
                data: null,
                error: error.message
            };
        }

        return {
            data: null,
            error: 'An unexpected error occurred while creating the reminder'
        };
    }
};

export const resumeNudge = async (id: string) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        throw new Error('Not authorised');
    }

    try {
        const nudge = await prisma.nudge.update({
            where: { id },
            data: { status: 'ACTIVE' }
        });

        await logNudgeResumed(userSession.user.id, {
            nudgeId: nudge.id
        });

        const nudges = await getTeamNudges(nudge.teamId);

        revalidatePath(`/nudges/${nudge.slug}`);

        return {
            data: nudges,
            error: null
        };
    } catch (error) {
        if (error instanceof Error) {
            return {
                data: null,
                error: error.message
            };
        }

        return {
            data: null,
            error: 'An unexpected error occurred while creating the reminder'
        };
    }
};

export const getNudgeBySlug = async (slug: string) => {
    try {
        const userSession = await authCheckServer();

        if (!userSession) {
            throw new Error('Not authorised');
        }

        const { user } = userSession;

        const nudge = await prisma.nudge.findUnique({
            where: {
                slug
            },
            include: {
                recipients: true,
                team: true,
                instances: {
                    include: {
                        reminders: true,
                        completion: { include: { user: true } }
                    }
                }
            }
        });

        if (!nudge) return null;

        return nudge;
    } catch (error) {
        if (error instanceof Error) {
            return null;
        }

        return null;
    }
};
