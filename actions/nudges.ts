'use server';

import * as z from 'zod';
import GithubSlugger from 'github-slugger';
import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';
import { CreateNudgeSchema } from '@/schemas/nudge';
import { error } from 'console';

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

export const getTeamNudges = async (teamId: string) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        throw new Error('Not authorised');
    }

    const { user, company, userCompany } = userSession;
    try {
        const nudges = await prisma.nudge.findMany({
            where: { teamId },
            include: { recipients: true }
        });

        return nudges;
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
                    firstName: recipient.firstName
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
