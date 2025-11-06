'use server';

import { headers } from 'next/headers';

import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';
import { CompleteNudgeResult } from '@/types/complete';
import { sendCompletionNotificationEmail } from '@/lib/mail';

export const getRecipientEvent = async (token: string) => {
    try {
        const recipientEvent = await prisma.nudgeRecipientEvent.findUnique({
            where: { token },
            include: {
                nudgeInstance: {
                    include: {
                        nudge: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                frequency: true,
                                interval: true,
                                dayOfWeek: true,
                                monthlyType: true,
                                dayOfMonth: true,
                                dayOfWeekForMonthly: true,
                                nthOccurrence: true,
                                timeOfDay: true
                            }
                        },
                        completion: true
                    }
                }
            }
        });

        return { data: recipientEvent, error: null };
    } catch (error) {
        return { data: null, error: `Error retrieving event: ${error}` };
    }
};

export const completeNudge = async ({
    token,
    comments
}: {
    token: string;
    comments?: string;
}): Promise<CompleteNudgeResult> => {
    try {
        const userSession = await authCheckServer();

        const userId = userSession ? userSession.user.id : null;

        const headersList = await headers();
        const ipAddress =
            headersList.get('x-forwarded-for') ||
            headersList.get('x-real-ip') ||
            'unknown';
        const userAgent = headersList.get('user-agent') || 'unknown';

        // Find the nudge recipient event by token
        const recipientEvent = await prisma.nudgeRecipientEvent.findUnique({
            where: { token },
            include: {
                nudgeInstance: {
                    include: {
                        nudge: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                frequency: true,
                                interval: true,
                                timezone: true
                            }
                        },
                        completion: true
                    }
                }
            }
        });

        if (!recipientEvent) {
            return {
                success: false,
                message: 'This reminder link is not valid.',
                error: 'TOKEN_NOT_FOUND'
            };
        }

        // Check if token has expired
        if (new Date() > recipientEvent.expiresAt) {
            return {
                success: false,
                message: 'This reminder link has expired.',
                error: 'TOKEN_EXPIRED'
            };
        }

        // Check if already completed
        if (recipientEvent.nudgeInstance.completion) {
            return {
                success: false,
                message: 'This reminder has already been completed.',
                error: 'ALREADY_COMPLETED',
                nudgeName: recipientEvent.nudgeInstance.nudge.name,
                completedAt:
                    recipientEvent.nudgeInstance.completion.createdAt.toISOString(),
                completedBy:
                    recipientEvent.nudgeInstance.completion.completedByName ||
                    recipientEvent.nudgeInstance.completion.completedBy
            };
        }

        // Create completion record and update related records
        const completion = await prisma.nudgeCompletion.create({
            data: {
                nudgeId: recipientEvent.nudgeInstance.nudge.id,
                nudgeInstanceId: recipientEvent.nudgeInstanceId,
                completedBy: recipientEvent.recipientEmail,
                completedByName: recipientEvent.recipientName,
                ipAddress,
                userAgent,
                reminderToken: token,
                userId,
                comments
            }
        });

        // Update the recipient event
        await prisma.nudgeRecipientEvent.update({
            where: { id: recipientEvent.id },
            data: {
                completedBy: recipientEvent.recipientEmail,
                completedAt: new Date(),
                completionIp: ipAddress,
                completionUa: userAgent,
                userId,
                usedAt: new Date()
            }
        });

        // Update the nudge instance status
        await prisma.nudgeInstance.update({
            where: { id: recipientEvent.nudgeInstanceId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date()
            }
        });

        // Calculate next scheduled date (if applicable)
        let nextScheduled: string | undefined;
        const nudge = recipientEvent.nudgeInstance.nudge;
        if (nudge.frequency === 'DAILY') {
            const next = new Date(recipientEvent.nudgeInstance.scheduledFor);
            next.setDate(next.getDate() + nudge.interval);
            nextScheduled = next.toISOString();
        } else if (nudge.frequency === 'WEEKLY') {
            const next = new Date(recipientEvent.nudgeInstance.scheduledFor);
            next.setDate(next.getDate() + 7 * nudge.interval);
            nextScheduled = next.toISOString();
        } else if (nudge.frequency === 'MONTHLY') {
            const next = new Date(recipientEvent.nudgeInstance.scheduledFor);
            next.setMonth(next.getMonth() + nudge.interval);
            nextScheduled = next.toISOString();
        }

        try {
            // Get all recipients and creator for this nudge
            const nudgeWithDetails = await prisma.nudge.findUnique({
                where: { id: recipientEvent.nudgeInstance.nudge.id },
                include: {
                    recipients: true,
                    creator: {
                        select: {
                            email: true,
                            name: true
                        }
                    }
                }
            });

            if (nudgeWithDetails) {
                // Create a map to deduplicate by email
                const emailMap = new Map<
                    string,
                    { email: string; name: string; isCreator: boolean }
                >();

                // Add all recipients
                nudgeWithDetails.recipients.forEach((recipient) => {
                    emailMap.set(recipient.email, {
                        email: recipient.email,
                        name: recipient.name,
                        isCreator: false
                    });
                });

                // Add creator (will overwrite if they're also a recipient, marking them as creator)
                emailMap.set(nudgeWithDetails.creator.email, {
                    email: nudgeWithDetails.creator.email,
                    name: nudgeWithDetails.creator.name,
                    isCreator: true
                });

                // Format completion date
                const completedAtFormatted = new Intl.DateTimeFormat('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: nudgeWithDetails.timezone
                }).format(completion.createdAt);

                // Send emails to all unique recipients
                const emailPromises = Array.from(emailMap.values()).map(
                    (recipient) =>
                        sendCompletionNotificationEmail({
                            email: 'kram@grebnesor.com',
                            name: recipient.name,
                            nudgeName: nudge.name,
                            nudgeDescription: nudge.description,
                            completedBy: recipientEvent.recipientName,
                            completedAt: completedAtFormatted,
                            comments,
                            isCreator: recipient.isCreator
                        })
                );

                // Send all emails in parallel
                await Promise.all(emailPromises);
            }
        } catch (emailError) {
            // Log error but don't fail the completion
            console.error(
                '[v0] Error sending completion notification emails:',
                emailError
            );
        }

        return {
            success: true,
            message: 'Reminder completed successfully!',
            nudgeName: nudge.name,
            nudgeDescription: nudge.description || undefined,
            completedAt: completion.createdAt.toISOString(),
            completedBy: recipientEvent.recipientName,
            nextScheduled
        };
    } catch (error) {
        console.error('[v0] Error completing nudge:', error);
        return {
            success: false,
            message:
                'An error occurred while completing the reminder. Please try again.',
            error: 'DATABASE_ERROR'
        };
    }
};
