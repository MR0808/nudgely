import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { sendDowngradeWarningEmail } from '@/lib/mail';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        // Calculate tomorrow's date (UTC)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0); // Start of day for comparison

        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999); // End of day

        // Query for pending subscriptions activating tomorrow
        const subscriptions = await prisma.pendingCompanySubscription.findMany({
            where: {
                activeDate: {
                    gte: tomorrow, // Greater than or equal to start of tomorrow
                    lte: endOfTomorrow // Less than or equal to end of tomorrow
                }
            },
            include: {
                company: { include: { creator: true } } // Include company details for email (assume it has an email field)
            }
        });

        if (subscriptions.length === 0) {
            return NextResponse.json(
                { message: 'No activations needed' },
                { status: 200 }
            );
        }

        // Process each subscription: Send mock email and optionally update status
        for (const sub of subscriptions) {
            if (sub.company) {
                const plan = await prisma.plan.findFirst({
                    where: {
                        OR: [
                            { stripeMonthlyId: sub.priceId },
                            { stripeYearlyId: sub.priceId }
                        ]
                    }
                });

                if (plan) {
                    await sendDowngradeWarningEmail({
                        email:
                            sub.company.contactEmail ||
                            sub.company.creator.email,
                        name: sub.company?.creator.name,
                        plan: plan.name
                    });
                }
            }
        }

        return NextResponse.json(
            {
                message: `Activated ${subscriptions.length} subscriptions`,
                count: subscriptions.length
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json(
            { error: 'Failed to process activations' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
