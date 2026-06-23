import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { sendDowngradeWarningEmail } from '@/lib/mail';
import { findPlanByStripePriceId } from '@/lib/stripe-prices';
import { verifyCronRequest } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
    const authError = verifyCronRequest(request);
    if (authError) return authError;

    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);

        const subscriptions = await prisma.pendingCompanySubscription.findMany({
            where: {
                activeDate: {
                    gte: tomorrow,
                    lte: endOfTomorrow
                },
                downgradeWarningSentAt: null
            },
            include: {
                company: { include: { creator: true } }
            }
        });

        if (subscriptions.length === 0) {
            return NextResponse.json(
                { message: 'No downgrade warnings to send' },
                { status: 200 }
            );
        }

        let sent = 0;

        for (const sub of subscriptions) {
            if (!sub.company) continue;

            const plan = await findPlanByStripePriceId(sub.priceId);
            if (!plan) continue;

            const emailResult = await sendDowngradeWarningEmail({
                email: sub.company.contactEmail || sub.company.creator.email,
                name: sub.company.creator.name,
                plan: plan.name
            });

            if (!emailResult.success) {
                console.error(
                    `[cron:check-subscriptions] Failed to email ${sub.company.id}:`,
                    emailResult.error
                );
                continue;
            }

            await prisma.pendingCompanySubscription.update({
                where: { id: sub.id },
                data: { downgradeWarningSentAt: new Date() }
            });
            sent++;
        }

        return NextResponse.json(
            {
                message: `Sent ${sent} downgrade warning email(s)`,
                count: sent
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('[cron:check-subscriptions] Cron job error:', error);
        return NextResponse.json(
            { error: 'Failed to process downgrade warnings' },
            { status: 500 }
        );
    }
}
