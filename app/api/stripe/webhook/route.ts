import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import {
    logSubscriptionCancel,
    logSubscriptionCreate,
    logSubscriptionUpdate
} from '@/actions/audit/audit-subscription';
import { checkDowngradedPlan } from '@/actions/subscriptions';
import {
    sendCancellationEmail,
    sendDowngradeEmail,
    sendUpgradeEmail
} from '@/lib/mail';

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
        return new Response(`Webhook Error: ${(err as Error).message}`, {
            status: 400
        });
    }

    switch (event.type) {
        case 'subscription_schedule.updated': {
            const session = event.data.object;
            if (session.status === 'released') {
                await prisma.pendingCompanySubscription.delete({
                    where: { stripeScheduleId: session.id }
                });
                break;
            }
            let customerId = '';
            if (typeof session.customer === 'string') {
                customerId = session.customer;
            } else {
                customerId = session.customer?.id || '1';
            }
            const company = await prisma.company.findUnique({
                where: { stripeCustomerId: customerId }
            });
            if (!company) break;
            if (session.status === 'active') {
                const pendingCompanySubscription =
                    await prisma.pendingCompanySubscription.findUnique({
                        where: { stripeScheduleId: session.id }
                    });
                if (!pendingCompanySubscription) {
                    let priceId = '';
                    if (typeof session.phases[1].items[0].price === 'string') {
                        priceId = session.phases[1].items[0].price;
                    } else {
                        priceId = session.phases[1].items[0].price.id || '1';
                    }
                    const nextMonthDate = new Date();
                    const activeDate = session.current_phase?.end_date
                        ? new Date(session.current_phase.end_date * 1000)
                        : (nextMonthDate.setMonth(nextMonthDate.getMonth() + 1),
                          nextMonthDate);
                    await prisma.pendingCompanySubscription.create({
                        data: {
                            stripeScheduleId: session.id,
                            activeDate,
                            priceId,
                            company: {
                                connect: {
                                    id: company.id
                                }
                            }
                        }
                    });
                }
            }
            break;
        }
        case 'checkout.session.completed': {
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
        case 'customer.subscription.created': {
            const session = event.data.object;
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
            const companySubscription = await prisma.companySubscription.create(
                {
                    data: {
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
                            (session.items?.data?.[0]?.current_period_end ||
                                0) * 1000
                        ),
                        status: session.status
                    }
                }
            );
            await logSubscriptionCreate(session.metadata.userId, {
                companyId: company.id,
                companySubscription: companySubscription.id
            });

            break;
        }
        case 'customer.subscription.updated': {
            const session = event.data.object;
            let customerId = '';
            if (typeof session.customer === 'string') {
                customerId = session.customer;
            } else {
                customerId = session.customer?.id || '1';
            }
            const company = await prisma.company.findFirst({
                where: { stripeCustomerId: customerId },
                include: {
                    plan: true,
                    companySubscription: true,
                    creator: true
                }
            });
            if (company && session.cancel_at) {
                await sendCancellationEmail({
                    email: company.contactEmail || company.creator.email,
                    name: company.creator.name,
                    endDate: new Date(session.cancel_at * 1000)
                });
            }
            let billingInterval: 'MONTHLY' | 'YEARLY' = 'MONTHLY';
            if (company && company.companySubscriptionId) {
                const priceId = session.items.data[0].price.id;
                if (
                    priceId &&
                    priceId !== company.plan.stripeMonthlyId &&
                    priceId !== company.plan.stripeYearlyId
                ) {
                    const plan = await prisma.plan.findFirst({
                        where: {
                            OR: [
                                { stripeMonthlyId: priceId },
                                { stripeYearlyId: priceId }
                            ]
                        }
                    });
                    if (priceId === plan?.stripeMonthlyId) {
                        billingInterval = 'MONTHLY';
                    } else {
                        billingInterval = 'YEARLY';
                    }
                    await prisma.company.update({
                        where: { id: company.id },
                        data: { planId: plan?.id }
                    });
                    await checkDowngradedPlan(company.id);
                    if (plan && company.plan.level > plan.level) {
                        await sendDowngradeEmail({
                            email:
                                company.contactEmail || company.creator.email,
                            name: company.creator.name,
                            plan: plan.name
                        });
                    } else if (plan && company.plan.level < plan.level) {
                        await sendUpgradeEmail({
                            email:
                                company.contactEmail || company.creator.email,
                            name: company.creator.name,
                            plan: plan.name
                        });
                    }
                    const companySubscription =
                        await prisma.companySubscription.update({
                            where: { id: company.companySubscriptionId },
                            data: { billingInterval, priceId }
                        });
                    await logSubscriptionUpdate(session.metadata.userId, {
                        companyId: company.id,
                        oldPlan: company.planId,
                        companySubscription: companySubscription.id
                    });
                }
            }
            break;
        }
        case 'invoice.paid': {
            // const session = event.data.object;
            // let customerId = '';
            // if (typeof session.customer === 'string') {
            //     customerId = session.customer;
            // } else {
            //     customerId = session.customer?.id || '1';
            // }
            // const company = await prisma.company.findFirst({
            //     where: { stripeCustomerId: customerId },
            //     include: { plan: true, companySubscription: true }
            // });
            // let billingInterval: 'MONTHLY' | 'YEARLY' = 'MONTHLY';
            // if (company && company.companySubscriptionId) {
            //     const priceId =
            //         session.lines.data[0].pricing?.price_details?.price;
            //     if (
            //         priceId &&
            //         priceId !== company.plan.stripeMonthlyId &&
            //         priceId !== company.plan.stripeYearlyId
            //     ) {
            //         const plan = await prisma.plan.findFirst({
            //             where: {
            //                 OR: [
            //                     { stripeMonthlyId: priceId },
            //                     { stripeYearlyId: priceId }
            //                 ]
            //             }
            //         });
            //         if (priceId === plan?.stripeMonthlyId) {
            //             billingInterval = 'MONTHLY';
            //         } else {
            //             billingInterval = 'YEARLY';
            //         }
            //         await prisma.company.update({
            //             where: { id: company.id },
            //             data: { planId: plan?.id }
            //         });
            //         await prisma.companySubscription.update({
            //             where: { id: company.companySubscriptionId },
            //             data: { billingInterval, priceId }
            //         });
            //     }
            // }
            break;
        }
        case 'invoice.payment_failed': {
            // mark payment failed; consider notifying user or retry logic
            break;
        }
        case 'customer.subscription.deleted': {
            const session = event.data.object;
            // mark canceled in your DB
            await prisma.companySubscription.updateMany({
                where: { stripeSubscriptionId: session.id },
                data: {
                    billingInterval: 'MONTHLY',
                    currentPeriodEnd: null,
                    nextBillingDate: null,
                    status: 'canceled'
                }
            });

            const plan = await prisma.plan.findFirst({ where: { level: 1 } });

            if (!plan) break;
            let customerId = '';
            if (typeof session.customer === 'string') {
                customerId = session.customer;
            } else {
                customerId = session.customer?.id || '1';
            }

            const company = await prisma.company.update({
                where: { stripeCustomerId: customerId },
                data: { planId: plan.id, stripeCustomerId: null }
            });

            await checkDowngradedPlan(company.id);

            await logSubscriptionCancel(session.metadata.userId, {
                companyId: company.id
            });

            break;
        }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
}
