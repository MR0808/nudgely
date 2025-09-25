import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature')!;
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.log(err);
        return new Response(`Webhook Error: ${(err as Error).message}`, {
            status: 400
        });
    }
    switch (event.type) {
        case 'checkout.session.completed': {
            // session.subscription contains subscription id
            // link subscription to your user by session.client_reference_id or customer
            // fetch subscription details and create DB entry
            const session = event.data.object;
            let customerId = '';
            if (session.client_reference_id) {
                if (typeof session.customer === 'string') {
                    customerId = session.customer;
                } else {
                    customerId = session.customer?.id || '1';
                }
                await prisma.company.update({
                    where: { id: session.client_reference_id },
                    data: { stripeCustomerId: customerId }
                });
            }
            break;
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.created': {
            const session = event.data.object;
            console.log(session.items.data[0]);
            let customerId = '';
            if (typeof session.customer === 'string') {
                customerId = session.customer;
            } else {
                customerId = session.customer?.id || '1';
            }
            const stripeId = session.items.data[0].plan.id;
            const interval = session.items.data[0].plan.interval;
            const plan = await prisma.plan.findFirst({
                where: {
                    OR: [
                        { stripeMonthlyId: stripeId },
                        { stripeYearlyId: stripeId }
                    ]
                },
                select: {
                    id: true // Only select the plan's ID
                }
            });

            if (!plan) {
                throw new Error('No plan found for the provided Stripe ID');
            }
            const company = await prisma.company.update({
                where: {
                    stripeCustomerId: customerId
                },
                data: {
                    planId: plan.id
                }
            });
            await prisma.companySubscription.upsert({
                where: { stripeSubscriptionId: customerId },
                create: {
                    stripeSubscriptionId: session.id,
                    billingInterval:
                        interval === 'month' ? 'MONTHLY' : 'YEARLY',
                    company: {
                        connect: {
                            id: company.id
                        }
                    }, // or map via user table
                    priceId: stripeId,
                    currentPeriodEnd: new Date(
                        (session.items?.data?.[0]?.current_period_end || 0) *
                            1000
                    ),
                    status: session.status
                },
                update: {
                    priceId: session.items?.data?.[0]?.price?.id || null,
                    currentPeriodEnd: new Date(
                        (session.items?.data?.[0]?.current_period_end || 0) *
                            1000
                    ),
                    billingInterval:
                        session.items?.data?.[0]?.price?.recurring?.interval ===
                        'month'
                            ? 'MONTHLY'
                            : 'YEARLY',
                    status: session.status
                }
            });
            break;
        }
        case 'invoice.paid': {
            // mark payment ok
            break;
        }
        case 'invoice.payment_failed': {
            // mark payment failed; consider notifying user or retry logic
            break;
        }
        case 'customer.subscription.deleted': {
            const sub = event.data.object;
            // mark canceled in your DB
            await prisma.companySubscription.updateMany({
                where: { stripeSubscriptionId: sub.id },
                data: { status: 'canceled' }
            });
            break;
        }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
}
