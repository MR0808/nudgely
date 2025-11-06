'use server';

import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    shouldSendNudge,
    hasNudgeEnded,
    wouldOccurAfterEndDate,
    calculateNextOccurrence,
    formatScheduleInfo
} from '@/lib/nudge-helpers';
import { sendNudgeEmail } from '@/lib/mail';

export async function GET(request: NextRequest) {
    try {
        // Verify the request is from Vercel Cron
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('[v0] Starting nudge cron job...');

        // Fetch all active nudges with their recipients
        const nudges = await prisma.nudge.findMany({
            where: {
                status: 'ACTIVE'
            },
            include: {
                recipients: true,
                instances: {
                    orderBy: {
                        scheduledFor: 'desc'
                    },
                    take: 1
                }
            }
        });

        console.log(`[v0] Found ${nudges.length} active nudges`);

        const results = {
            processed: 0,
            sent: 0,
            skipped: 0,
            finished: 0,
            errors: 0
        };

        // Process each nudge
        for (const nudge of nudges) {
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
                        `[v0] Nudge ${nudge.name} (${nudge.id}) has reached its end condition`
                    );

                    // Update nudge status to FINISHED
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
                        `[v0] Next occurrence for ${nudge.name} would be after end date, marking as FINISHED`
                    );

                    await prisma.nudge.update({
                        where: { id: nudge.id },
                        data: { status: 'FINISHED' }
                    });

                    results.finished++;
                    continue;
                }

                // Check if this nudge should be sent now
                const shouldSend = shouldSendNudge(nudge);

                if (!shouldSend) {
                    results.skipped++;
                    continue;
                }

                console.log(`[v0] Sending nudge: ${nudge.name} (${nudge.id})`);

                // Parse the time of day (format: "9:00 AM" or "3:00 PM")
                const [time, period] = nudge.timeOfDay.split(' ');
                const [hours, minutes] = time.split(':').map(Number);
                const hour24 =
                    period === 'PM' && hours !== 12
                        ? hours + 12
                        : hours === 12 && period === 'AM'
                          ? 0
                          : hours;

                // Create scheduled time in the nudge's timezone
                const now = new Date();
                const scheduledFor = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                    hour24,
                    minutes || 0,
                    0,
                    0
                );

                // Create a NudgeInstance
                const nudgeInstance = await prisma.nudgeInstance.create({
                    data: {
                        nudgeId: nudge.id,
                        slug: `${nudge.slug}-${Date.now()}`,
                        scheduledFor: scheduledFor,
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

                let successfulSends = 0;
                let failedSends = 0;

                for (const recipient of nudge.recipients) {
                    try {
                        // Generate unique token for this recipient event
                        const token = `${nudgeInstance.id}-${recipient.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                        const expiresAt = new Date(
                            Date.now() + 30 * 24 * 60 * 60 * 1000
                        ); // 30 days

                        // Create the completion URL with token
                        const completionUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/complete/${token}`;

                        // Create NudgeRecipientEvent record
                        const recipientEvent =
                            await prisma.nudgeRecipientEvent.create({
                                data: {
                                    nudgeInstanceId: nudgeInstance.id,
                                    recipientEmail: recipient.email,
                                    recipientName: recipient.name,
                                    token: token,
                                    expiresAt: expiresAt,
                                    sent: false,
                                    attempts: 0
                                }
                            });

                        // Send the email
                        const emailResult = await sendNudgeEmail({
                            // email: recipient.email,
                            email: 'kram@grebnesor.com',
                            name: recipient.name,
                            nudgeName: nudge.name,
                            nudgeDescription: nudge.description,
                            completionUrl: completionUrl,
                            scheduleInfo
                        });

                        // Update the recipient event based on send result
                        if (emailResult.success) {
                            await prisma.nudgeRecipientEvent.update({
                                where: { id: recipientEvent.id },
                                data: {
                                    sent: true,
                                    attempts: 1,
                                    lastAttemptAt: new Date()
                                }
                            });
                            successfulSends++;
                            console.log(
                                `[v0] Email sent successfully to ${recipient.email}`
                            );
                        } else {
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
                            failedSends++;
                            console.error(
                                `[v0] Failed to send email to ${recipient.email}: ${emailResult.error}`
                            );
                        }
                    } catch (recipientError) {
                        failedSends++;
                        console.error(
                            `[v0] Error processing recipient ${recipient.email}:`,
                            recipientError
                        );
                    }
                }

                console.log(
                    `[v0] Email sending complete: ${successfulSends} successful, ${failedSends} failed`
                );

                // Update the nudge's lastInstanceCreatedAt
                await prisma.nudge.update({
                    where: { id: nudge.id },
                    data: {
                        lastInstanceCreatedAt: new Date()
                    }
                });

                // Update instance status based on email results
                const instanceStatus =
                    failedSends === 0
                        ? 'COMPLETED'
                        : failedSends === nudge.recipients.length
                          ? 'FAILED'
                          : 'COMPLETED';

                await prisma.nudgeInstance.update({
                    where: { id: nudgeInstance.id },
                    data: {
                        status: instanceStatus,
                        completedAt:
                            instanceStatus === 'COMPLETED' ? new Date() : null,
                        failedAt:
                            instanceStatus === 'FAILED' ? new Date() : null
                    }
                });

                results.sent++;
            } catch (error) {
                console.error(
                    `[v0] Error processing nudge ${nudge.id}:`,
                    error
                );
                results.errors++;
            }
        }

        console.log('[v0] Nudge cron job completed:', results);

        return NextResponse.json({
            success: true,
            results
        });
    } catch (error) {
        console.error('[v0] Cron job error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message:
                    error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
