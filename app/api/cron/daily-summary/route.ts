'use server';

import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendDailySummaryEmail } from '@/lib/mail';

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

        console.log('[v0] Starting daily summary cron job...');

        // Calculate date range for today (Australia/Melbourne time)
        const melbourneTime = new Date().toLocaleString('en-US', {
            timeZone: 'Australia/Melbourne'
        });
        const now = new Date(melbourneTime);
        const startOfDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            0,
            0,
            0
        );
        const endOfDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            23,
            59,
            59
        );

        // Convert to UTC for database queries
        const startOfDayUTC = new Date(
            startOfDay.toLocaleString('en-US', { timeZone: 'UTC' })
        );
        const endOfDayUTC = new Date(
            endOfDay.toLocaleString('en-US', { timeZone: 'UTC' })
        );

        console.log(
            `[v0] Collecting stats for ${startOfDay.toLocaleDateString()}`
        );

        // Fetch all nudge instances created today
        const todaysInstances = await prisma.nudgeInstance.findMany({
            where: {
                createdAt: {
                    gte: startOfDayUTC,
                    lte: endOfDayUTC
                }
            },
            include: {
                nudge: {
                    include: {
                        team: { include: { company: true } }
                    }
                },
                events: true
            }
        });

        // Fetch completions from today
        const todaysCompletions = await prisma.nudgeCompletion.findMany({
            where: {
                createdAt: {
                    gte: startOfDayUTC,
                    lte: endOfDayUTC
                }
            }
        });

        // Fetch nudges that finished today
        const finishedNudges = await prisma.nudge.findMany({
            where: {
                status: 'FINISHED',
                updatedAt: {
                    gte: startOfDayUTC,
                    lte: endOfDayUTC
                }
            }
        });

        // Count active nudges
        const activeNudges = await prisma.nudge.count({
            where: {
                status: 'ACTIVE'
            }
        });

        // Calculate overall stats
        const totalNudgesSent = todaysInstances.length;
        const totalEmailsSent = todaysInstances.reduce(
            (sum, instance) =>
                sum + instance.events.filter((e) => e.sent).length,
            0
        );
        const totalEmailsFailed = todaysInstances.reduce(
            (sum, instance) =>
                sum +
                instance.events.filter((e) => !e.sent && e.attempts > 0).length,
            0
        );

        // Calculate team-specific stats
        const teamStatsMap = new Map<
            string,
            {
                teamName: string;
                companyName: string;
                nudgesSent: number;
                emailsSent: number;
                emailsFailed: number;
                completions: number;
            }
        >();

        for (const instance of todaysInstances) {
            const teamId = instance.nudge.teamId;
            const teamName = instance.nudge.team.name;
            const companyName =
                instance.nudge.team.company.name || 'Unknown Company';

            if (!teamStatsMap.has(teamId)) {
                teamStatsMap.set(teamId, {
                    teamName,
                    companyName,
                    nudgesSent: 0,
                    emailsSent: 0,
                    emailsFailed: 0,
                    completions: 0
                });
            }

            const teamStats = teamStatsMap.get(teamId)!;
            teamStats.nudgesSent++;
            teamStats.emailsSent += instance.events.filter(
                (e) => e.sent
            ).length;
            teamStats.emailsFailed += instance.events.filter(
                (e) => !e.sent && e.attempts > 0
            ).length;
        }

        // Add completions to team stats
        for (const completion of todaysCompletions) {
            const nudge = await prisma.nudge.findUnique({
                where: { id: completion.nudgeId },
                include: { team: true }
            });

            if (nudge) {
                const teamId = nudge.teamId;
                if (teamStatsMap.has(teamId)) {
                    teamStatsMap.get(teamId)!.completions++;
                }
            }
        }

        const teamStats = Array.from(teamStatsMap.values());

        console.log('[v0] Daily summary stats:');
        console.log(`  Nudges sent: ${totalNudgesSent}`);
        console.log(`  Emails sent: ${totalEmailsSent}`);
        console.log(`  Emails failed: ${totalEmailsFailed}`);
        console.log(`  Completions: ${todaysCompletions.length}`);
        console.log(`  Teams: ${teamStats.length}`);

        // Send summary email to admin
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM;
        if (!adminEmail) {
            console.warn(
                '[v0] No admin email configured, skipping summary email'
            );
            return NextResponse.json({
                success: true,
                message: 'Stats collected but no admin email configured',
                stats: {
                    totalNudgesSent,
                    totalEmailsSent,
                    totalEmailsFailed,
                    totalCompletions: todaysCompletions.length,
                    totalActiveNudges: activeNudges,
                    totalFinishedNudges: finishedNudges.length,
                    teamStats
                }
            });
        }

        const emailResult = await sendDailySummaryEmail({
            adminEmail,
            date: startOfDay.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            totalNudgesSent,
            totalEmailsSent,
            totalEmailsFailed,
            totalCompletions: todaysCompletions.length,
            totalActiveNudges: activeNudges,
            totalFinishedNudges: finishedNudges.length,
            teamStats
        });

        if (!emailResult.success) {
            console.error(
                '[v0] Failed to send daily summary email:',
                emailResult.error
            );
        }

        return NextResponse.json({
            success: true,
            emailSent: emailResult.success,
            stats: {
                totalNudgesSent,
                totalEmailsSent,
                totalEmailsFailed,
                totalCompletions: todaysCompletions.length,
                totalActiveNudges: activeNudges,
                totalFinishedNudges: finishedNudges.length,
                teamStats
            }
        });
    } catch (error) {
        console.error('[v0] Daily summary cron error:', error);
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
