import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';
import {
    shouldSendNudge,
    hasNudgeEnded,
    wouldOccurAfterEndDate,
    calculateNextOccurrence,
    formatScheduleInfo,
    getDateComponentsInTimezone,
    parseTimeOfDayHourMinute
} from '@/lib/nudge-helpers';
import { sendNudgeEmail } from '@/lib/mail';
import { mapPool } from '@/lib/map-pool';
import { getSuppressedEmailSet } from '@/lib/email-suppression';
import {
    companySubscriptionNotPaymentBlocked
} from '@/lib/subscription-payment';
import {
    CRON_BUDGET_MS,
    NUDGE_BATCH_SIZE,
    RECIPIENT_CONCURRENCY,
    REMINDER_BATCH_SIZE
} from '@/lib/cron/send-nudges-config';

type NudgeWithRecipientsAndInstances = Prisma.NudgeGetPayload<{
    include: { recipients: true; instances: true };
}>;

type NudgeInstanceWithNudgeAndEvents = Prisma.NudgeInstanceGetPayload<{
    include: {
        nudge: {
            include: { recipients: true };
        };
        events: true;
    };
}>;

export type SendNudgesJobResults = {
    processed: number;
    sent: number;
    skipped: number;
    finished: number;
    errors: number;
    reminders: number;
    suppressed: number;
    hasMoreNudges: boolean;
    hasMoreReminders: boolean;
};

const activeNudgeWhere = {
    status: 'ACTIVE' as const,
    team: {
        status: 'ACTIVE' as const,
        isFrozen: false,
        company: companySubscriptionNotPaymentBlocked
    }
};

const nudgeInclude = {
    recipients: true,
    instances: {
        orderBy: { scheduledFor: 'desc' as const },
        take: 1
    }
} satisfies Prisma.NudgeInclude;

export async function runSendNudgesJob(): Promise<SendNudgesJobResults> {
    try {
        console.log('[cron:send-nudges] Starting nudge cron job...');

        const startedAt = Date.now();
        const isOverBudget = () => Date.now() - startedAt >= CRON_BUDGET_MS;

        const results: SendNudgesJobResults = {
            processed: 0,
            sent: 0,
            skipped: 0,
            finished: 0,
            errors: 0,
            reminders: 0,
            suppressed: 0,
            hasMoreNudges: false,
            hasMoreReminders: false
        };

        let nudgeCursor: string | undefined;
        let stoppedNudgesEarly = false;

        while (!isOverBudget()) {
            const nudgeBatch = (await prisma.nudge.findMany({
                where: activeNudgeWhere,
                include: nudgeInclude,
                orderBy: { id: 'asc' },
                take: NUDGE_BATCH_SIZE,
                ...(nudgeCursor
                    ? { skip: 1, cursor: { id: nudgeCursor } }
                    : {})
            })) as NudgeWithRecipientsAndInstances[];

            if (nudgeBatch.length === 0) {
                break;
            }

            nudgeCursor = nudgeBatch[nudgeBatch.length - 1]?.id;

            console.log(
                `[cron:send-nudges] Processing nudge batch of ${nudgeBatch.length}`
            );

            for (const nudge of nudgeBatch) {
                if (isOverBudget()) {
                    stoppedNudgesEarly = true;
                    console.log(
                        '[cron:send-nudges] Time budget exceeded, stopping nudge processing'
                    );
                    break;
                }

            results.processed++;

            try {
                const instanceCount = await prisma.nudgeInstance.count({
                    where: { nudgeId: nudge.id }
                });

                const hasEnded = await hasNudgeEnded(
                    {
                        endType: nudge.endType,
                        endDate: nudge.endDate,
                        endAfterOccurrences: nudge.endAfterOccurrences
                    },
                    instanceCount
                );

                if (hasEnded) {
                    console.log(
                        `[cron:send-nudges] Nudge ${nudge.name} (${nudge.id}) has reached its end condition`
                    );

                    await prisma.nudge.update({
                        where: { id: nudge.id },
                        data: { status: 'FINISHED' }
                    });

                    results.finished++;
                    continue;
                }

                const nextOccurrence = calculateNextOccurrence(nudge);
                if (
                    nextOccurrence &&
                    wouldOccurAfterEndDate(nextOccurrence, nudge)
                ) {
                    console.log(
                        `[cron:send-nudges] Next occurrence for ${nudge.name} would be after end date, marking as FINISHED`
                    );

                    await prisma.nudge.update({
                        where: { id: nudge.id },
                        data: { status: 'FINISHED' }
                    });

                    results.finished++;
                    continue;
                }

                const shouldSend = shouldSendNudge(nudge);

                if (!shouldSend) {
                    results.skipped++;
                    continue;
                }

                console.log(
                    `[cron:send-nudges] Sending nudge: ${nudge.name} (${nudge.id})`
                );

                const { hour: hour24, minute } = parseTimeOfDayHourMinute(
                    nudge.timeOfDay
                );

                const now = new Date();
                const scheduledFor = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                    hour24,
                    minute,
                    0,
                    0
                );

                const nudgeInstance = await prisma.nudgeInstance.create({
                    data: {
                        nudgeId: nudge.id,
                        slug: `${nudge.slug}-${Date.now()}`,
                        scheduledFor,
                        status: 'PENDING'
                    }
                });

                const scheduleInfo = formatScheduleInfo({
                    frequency: nudge.frequency,
                    interval: nudge.interval,
                    dayOfWeek: nudge.dayOfWeek,
                    monthlyType: nudge.monthlyType,
                    dayOfMonth: nudge.dayOfMonth,
                    nthOccurrence: nudge.nthOccurrence,
                    dayOfWeekForMonthly: nudge.dayOfWeekForMonthly,
                    timeOfDay: nudge.timeOfDay
                });

                const suppressedEmails = await getSuppressedEmailSet(
                    nudge.recipients.map((recipient) => recipient.email)
                );
                const deliverableRecipients = nudge.recipients.filter(
                    (recipient) =>
                        !suppressedEmails.has(recipient.email.toLowerCase())
                );
                const suppressedCount =
                    nudge.recipients.length - deliverableRecipients.length;
                results.suppressed += suppressedCount;

                if (suppressedCount > 0) {
                    console.log(
                        `[cron:send-nudges] Skipping ${suppressedCount} suppressed recipient(s) for ${nudge.name}`
                    );
                }

                const sendOutcomes = await mapPool(
                    deliverableRecipients,
                    RECIPIENT_CONCURRENCY,
                    async (recipient) => {
                        try {
                            const token = `${nudgeInstance.id}-${recipient.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                            let expiresAt = new Date(
                                Date.now() + 30 * 24 * 60 * 60 * 1000
                            );

                            if (nudge.frequency === 'DAILY') {
                                expiresAt = new Date(
                                    Date.now() + 24 * 60 * 60 * 1000
                                );
                            }

                            if (nudge.frequency === 'WEEKLY') {
                                expiresAt = new Date(
                                    Date.now() + 7 * 24 * 60 * 60 * 1000
                                );
                            }

                            const completionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/complete/${token}`;

                            const recipientEvent =
                                await prisma.nudgeRecipientEvent.create({
                                    data: {
                                        nudgeInstanceId: nudgeInstance.id,
                                        recipientEmail: recipient.email,
                                        recipientName: recipient.name,
                                        token,
                                        expiresAt,
                                        sent: false,
                                        attempts: 0
                                    }
                                });

                            let emailResult = await sendNudgeEmail({
                                email: recipient.email,
                                name: recipient.name,
                                nudgeName: nudge.name,
                                nudgeDescription: nudge.description,
                                completionUrl,
                                scheduleInfo
                            });

                            if (!emailResult.success) {
                                emailResult = await sendNudgeEmail({
                                    email: recipient.email,
                                    name: recipient.name,
                                    nudgeName: nudge.name,
                                    nudgeDescription: nudge.description,
                                    completionUrl,
                                    scheduleInfo
                                });
                            }

                            if (emailResult.success) {
                                await prisma.nudgeRecipientEvent.update({
                                    where: { id: recipientEvent.id },
                                    data: {
                                        sent: true,
                                        attempts: 1,
                                        lastAttemptAt: new Date()
                                    }
                                });
                                console.log(
                                    `[cron:send-nudges] Email sent successfully to ${recipient.email}`
                                );
                                return true;
                            }

                            await prisma.nudgeRecipientEvent.update({
                                where: { id: recipientEvent.id },
                                data: {
                                    sent: false,
                                    attempts: 1,
                                    lastAttemptAt: new Date(),
                                    errorMessage:
                                        emailResult.error || 'Unknown error'
                                }
                            });
                            console.error(
                                `[cron:send-nudges] Failed to send email to ${recipient.email}: ${emailResult.error}`
                            );
                            return false;
                        } catch (recipientError) {
                            console.error(
                                `[cron:send-nudges] Error processing recipient ${recipient.email}:`,
                                recipientError
                            );
                            return false;
                        }
                    }
                );

                const successfulSends = sendOutcomes.filter(Boolean).length;
                const failedSends = sendOutcomes.length - successfulSends;

                console.log(
                    `[cron:send-nudges] Email sending complete: ${successfulSends} successful, ${failedSends} failed`
                );

                await prisma.nudge.update({
                    where: { id: nudge.id },
                    data: {
                        lastInstanceCreatedAt: new Date()
                    }
                });

                const instanceStatus =
                    failedSends === deliverableRecipients.length &&
                    deliverableRecipients.length > 0
                        ? 'FAILED'
                        : suppressedCount === nudge.recipients.length &&
                            nudge.recipients.length > 0
                          ? 'FAILED'
                          : 'PENDING';

                await prisma.nudgeInstance.update({
                    where: { id: nudgeInstance.id },
                    data: {
                        status: instanceStatus,
                        failedAt:
                            instanceStatus === 'FAILED' ? new Date() : null
                    }
                });

                results.sent++;
            } catch (error) {
                console.error(
                    `[cron:send-nudges] Error processing nudge ${nudge.id}:`,
                    error
                );
                results.errors++;
            }
            }

            if (stoppedNudgesEarly) {
                break;
            }

            if (nudgeBatch.length < NUDGE_BATCH_SIZE) {
                break;
            }
        }

        results.hasMoreNudges =
            stoppedNudgesEarly ||
            (nudgeCursor !== undefined &&
                (await prisma.nudge.count({
                    where: {
                        ...activeNudgeWhere,
                        id: { gt: nudgeCursor }
                    }
                })) > 0);

        if (!isOverBudget()) {
            console.log('[cron:send-nudges] Checking for reminders...');
            let reminderCursor: string | undefined;
            let stoppedRemindersEarly = false;

            while (!isOverBudget()) {
                const pendingInstances = (await prisma.nudgeInstance.findMany({
                    where: {
                        status: 'PENDING',
                        nudge: {
                            team: {
                                status: 'ACTIVE',
                                isFrozen: false,
                                company: companySubscriptionNotPaymentBlocked
                            }
                        }
                    },
                    include: {
                        nudge: {
                            include: { recipients: true }
                        },
                        events: true
                    },
                    orderBy: { id: 'asc' },
                    take: REMINDER_BATCH_SIZE,
                    ...(reminderCursor
                        ? { skip: 1, cursor: { id: reminderCursor } }
                        : {})
                })) as NudgeInstanceWithNudgeAndEvents[];

                if (pendingInstances.length === 0) {
                    break;
                }

                reminderCursor =
                    pendingInstances[pendingInstances.length - 1]?.id;

                for (const instance of pendingInstances) {
                if (isOverBudget()) {
                    stoppedRemindersEarly = true;
                    console.log(
                        '[cron:send-nudges] Time budget exceeded, stopping reminder processing'
                    );
                    break;
                }

                const { nudge } = instance;

                const now = new Date();
                const { hour, minute } = getDateComponentsInTimezone(
                    now,
                    nudge.timezone
                );
                const { hour: nudgeHour, minute: nudgeMinute } =
                    parseTimeOfDayHourMinute(nudge.timeOfDay);

                const currentMinutes = hour * 60 + minute;
                const targetMinutes = nudgeHour * 60 + nudgeMinute;
                const diff = currentMinutes - targetMinutes;

                if (diff < 0 || diff >= 60) continue;

                const today = now.toDateString();
                if (instance.createdAt.toDateString() === today) continue;

                console.log(
                    `[cron:send-nudges] Processing reminders for nudge instance ${instance.id} (${nudge.name})`
                );

                const scheduleInfo = formatScheduleInfo({
                    frequency: nudge.frequency,
                    interval: nudge.interval,
                    dayOfWeek: nudge.dayOfWeek,
                    monthlyType: nudge.monthlyType,
                    dayOfMonth: nudge.dayOfMonth,
                    nthOccurrence: nudge.nthOccurrence,
                    dayOfWeekForMonthly: nudge.dayOfWeekForMonthly,
                    timeOfDay: nudge.timeOfDay
                });

                const reminderSuppressed = await getSuppressedEmailSet(
                    instance.events.map((event) => event.recipientEmail)
                );

                const eventsToRemind = instance.events.filter((event) => {
                    if (event.completedAt) return false;

                    if (
                        reminderSuppressed.has(
                            event.recipientEmail.toLowerCase()
                        )
                    ) {
                        return false;
                    }

                    if (event.lastAttemptAt) {
                        const hoursSince =
                            (now.getTime() - event.lastAttemptAt.getTime()) /
                            (1000 * 60 * 60);
                        if (hoursSince < 18) return false;
                    }

                    return true;
                });

                await mapPool(
                    eventsToRemind,
                    RECIPIENT_CONCURRENCY,
                    async (event) => {
                        try {
                            const completionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/complete/${event.token}`;

                            const emailResult = await sendNudgeEmail({
                                email: event.recipientEmail,
                                name: event.recipientName,
                                nudgeName: nudge.name,
                                nudgeDescription: nudge.description,
                                completionUrl,
                                scheduleInfo,
                                isReminder: true
                            });

                            if (emailResult.success) {
                                await prisma.nudgeRecipientEvent.update({
                                    where: { id: event.id },
                                    data: {
                                        sent: true,
                                        attempts: { increment: 1 },
                                        lastAttemptAt: new Date()
                                    }
                                });
                                results.reminders++;
                                console.log(
                                    `[cron:send-nudges] Reminder sent to ${event.recipientEmail}`
                                );
                            } else {
                                await prisma.nudgeRecipientEvent.update({
                                    where: { id: event.id },
                                    data: {
                                        attempts: { increment: 1 },
                                        lastAttemptAt: new Date(),
                                        errorMessage:
                                            emailResult.error ||
                                            'Reminder failed'
                                    }
                                });
                            }
                        } catch (err) {
                            console.error(
                                `[cron:send-nudges] Error sending reminder to ${event.recipientEmail}:`,
                                err
                            );
                        }
                    }
                );
                }

                if (stoppedRemindersEarly) {
                    break;
                }

                if (pendingInstances.length < REMINDER_BATCH_SIZE) {
                    break;
                }
            }

            results.hasMoreReminders =
                stoppedRemindersEarly ||
                (reminderCursor !== undefined &&
                    (await prisma.nudgeInstance.count({
                        where: {
                            status: 'PENDING',
                            nudge: {
                                team: {
                                    status: 'ACTIVE',
                                    isFrozen: false,
                                    company: companySubscriptionNotPaymentBlocked
                                }
                            },
                            id: { gt: reminderCursor }
                        }
                    })) > 0);
        } else {
            console.log(
                '[cron:send-nudges] Skipping reminders due to time budget'
            );
        }

        console.log('[cron:send-nudges] Nudge cron job completed:', results);

        return results;
    } catch (error) {
        console.error('[cron:send-nudges] Cron job error:', error);
        throw error;
    }
}
