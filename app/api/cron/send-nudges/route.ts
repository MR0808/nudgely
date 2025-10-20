'use server';

import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { shouldSendNudge } from '@/lib/nudge-helpers';

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
            errors: 0
        };

        // Process each nudge
        for (const nudge of nudges) {
            results.processed++;

            try {
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

                // Create ReminderEvent records for each recipient
                const reminderEvents = await Promise.all(
                    nudge.recipients.map((recipient) =>
                        prisma.reminderEvent.create({
                            data: {
                                nudgeInstanceId: nudgeInstance.id,
                                recipientEmail: recipient.email,
                                recipientName: recipient.name,
                                token: `${nudgeInstance.id}-${recipient.id}-${Date.now()}`,
                                expiresAt: new Date(
                                    Date.now() + 30 * 24 * 60 * 60 * 1000
                                ), // 30 days
                                sent: false
                            }
                        })
                    )
                );

                console.log(
                    `[v0] Created ${reminderEvents.length} reminder events for nudge ${nudge.id}`
                );

                // TODO: Send emails to recipients
                // This is where you would integrate with your email service (Resend, SendGrid, etc.)
                // For each reminderEvent, send an email to the recipient
                // Example:
                // await sendEmail({
                //   to: reminderEvent.recipientEmail,
                //   subject: nudge.name,
                //   body: nudge.description,
                //   token: reminderEvent.token
                // });

                // Update the nudge's lastInstanceCreatedAt
                await prisma.nudge.update({
                    where: { id: nudge.id },
                    data: {
                        lastInstanceCreatedAt: new Date()
                    }
                });

                // Mark reminder events as sent (after email sending succeeds)
                await prisma.reminderEvent.updateMany({
                    where: {
                        nudgeInstanceId: nudgeInstance.id
                    },
                    data: {
                        sent: true,
                        lastAttemptAt: new Date(),
                        attempts: 1
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
