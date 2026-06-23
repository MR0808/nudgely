import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import {
    logSubscriptionCancel,
    logSubscriptionUpdate
} from '@/actions/audit/audit-subscription';
import { checkDowngradedPlan } from '@/actions/subscriptions';
import {
    sendCancellationEmail,
    sendDowngradeEmail,
    sendPaymentFailedEmail,
    sendUpgradeEmail
} from '@/lib/mail';
import {
    applySubscriptionToCompany,
    syncCheckoutSessionToCompany
} from '@/lib/sync-company-subscription';
import {
    findPlanByStripePriceId,
    planMatchesStripePrice
} from '@/lib/stripe-prices';
import {
    buildSubscriptionSyncData,
    getAuditUserId,
    getCancellationEndDate,
    isAdminPlanChange,
    shouldSendCancellationEmail,
    stripeCustomerId
} from '@/lib/stripe-subscription';

async function isDuplicateStripeEvent(eventId: string): Promise<boolean> {
    const existing = await prisma.processedStripeEvent.findUnique({
        where: { id: eventId }
    });
    return existing !== null;
}

async function markStripeEventProcessed(
    eventId: string,
    eventType: string
): Promise<void> {
    await prisma.processedStripeEvent.create({
        data: { id: eventId, type: eventType }
    });
}

async function syncSubscriptionRecord(
    subscription: Stripe.Subscription,
    companySubscriptionId: string
) {
    return prisma.companySubscription.update({
        where: { id: companySubscriptionId },
        data: buildSubscriptionSyncData(subscription)
    });
}

export async function POST(req: Request) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature')!;
    let event: Stripe.Event;

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

    if (await isDuplicateStripeEvent(event.id)) {
        return new Response(
            JSON.stringify({ received: true, duplicate: true }),
            { status: 200 }
        );
    }

    try {
        await processStripeEvent(event);
        await markStripeEventProcessed(event.id, event.type);
    } catch (err) {
        console.error('[stripe:webhook] Handler error:', err);
        return new Response(
            JSON.stringify({ error: 'Webhook handler failed' }),
            { status: 500 }
        );
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
}

async function processStripeEvent(event: Stripe.Event) {
    switch (event.type) {
        case 'subscription_schedule.updated':
            await handleSubscriptionScheduleUpdated(event);
            break;
        case 'checkout.session.completed':
            await handleCheckoutSessionCompleted(event);
            break;
        case 'customer.subscription.created':
            await handleSubscriptionCreated(event);
            break;
        case 'customer.subscription.updated':
            await handleSubscriptionUpdated(event);
            break;
        case 'invoice.paid':
            await handleInvoicePaid(event);
            break;
        case 'invoice.payment_failed':
            await handleInvoicePaymentFailed(event);
            break;
        case 'customer.subscription.deleted':
            await handleSubscriptionDeleted(event);
            break;
    }
}

async function handleSubscriptionScheduleUpdated(event: Stripe.Event) {
    const session = event.data.object as Stripe.SubscriptionSchedule;

    if (session.status === 'released') {
        await prisma.pendingCompanySubscription.deleteMany({
            where: { stripeScheduleId: session.id }
        });
        return;
    }

    const customerId = stripeCustomerId(session.customer);
    if (!customerId) return;

    const company = await prisma.company.findUnique({
        where: { stripeCustomerId: customerId }
    });
    if (!company) return;

    if (session.status !== 'active' || !session.phases[1]?.items[0]) {
        return;
    }

    const existing = await prisma.pendingCompanySubscription.findUnique({
        where: { stripeScheduleId: session.id }
    });
    if (existing) return;

    const priceRef = session.phases[1].items[0].price;
    const priceId =
        typeof priceRef === 'string' ? priceRef : priceRef?.id || '';

    if (!priceId) return;

    const activeDate = session.current_phase?.end_date
        ? new Date(session.current_phase.end_date * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.pendingCompanySubscription.create({
        data: {
            stripeScheduleId: session.id,
            activeDate,
            priceId,
            company: { connect: { id: company.id } }
        }
    });
}

async function handleCheckoutSessionCompleted(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;
    if (!session.id) return;

    await syncCheckoutSessionToCompany(session.id, {
        companyIdHint: session.client_reference_id ?? undefined,
        sendWelcomeEmail: true,
        writeAuditLog: true
    });
}

async function handleSubscriptionCreated(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;

    await applySubscriptionToCompany(subscription, {
        companyIdHint: subscription.metadata?.companyId,
        sendWelcomeEmail: true,
        writeAuditLog: true
    });
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    const previous = event.data.previous_attributes as
        | Partial<Stripe.Subscription>
        | undefined;
    const customerId = stripeCustomerId(subscription.customer);
    if (!customerId) return;

    let company = await prisma.company.findFirst({
        where: { stripeCustomerId: customerId },
        include: {
            plan: true,
            companySubscription: true,
            creator: true
        }
    });

    if (!company && subscription.metadata?.companyId) {
        company = await prisma.company.findFirst({
            where: { id: subscription.metadata.companyId },
            include: {
                plan: true,
                companySubscription: true,
                creator: true
            }
        });
    }

    if (!company?.companySubscriptionId) {
        await applySubscriptionToCompany(subscription, {
            companyIdHint: subscription.metadata?.companyId,
            sendWelcomeEmail: false,
            writeAuditLog: true
        });
        return;
    }

    const syncData = buildSubscriptionSyncData(subscription);
    const priceId = syncData.priceId;
    const previousPriceId = company.companySubscription?.priceId;

    if (shouldSendCancellationEmail(subscription, previous)) {
        const endDate = getCancellationEndDate(subscription);
        if (endDate) {
            await sendCancellationEmail({
                email: company.contactEmail || company.creator.email,
                name: company.creator.name,
                endDate
            });
        }
    }

    const planChanged = Boolean(priceId && priceId !== previousPriceId);

    if (planChanged) {
        const plan = await findPlanByStripePriceId(priceId);
        if (plan) {
            const oldPlan = company.plan;

            await prisma.company.update({
                where: { id: company.id },
                data: { planId: plan.id }
            });

            await checkDowngradedPlan(company.id);

            if (!isAdminPlanChange(subscription)) {
                if (oldPlan.level > plan.level) {
                    await sendDowngradeEmail({
                        email: company.contactEmail || company.creator.email,
                        name: company.creator.name,
                        plan: plan.name
                    });
                } else if (oldPlan.level < plan.level) {
                    await sendUpgradeEmail({
                        email: company.contactEmail || company.creator.email,
                        name: company.creator.name,
                        plan: plan.name
                    });
                }
            }

            const companySubscription = await syncSubscriptionRecord(
                subscription,
                company.companySubscriptionId
            );

            await logSubscriptionUpdate(
                getAuditUserId(subscription, company.creatorId) ||
                    company.creatorId,
                {
                    companyId: company.id,
                    oldPlan: company.planId,
                    companySubscription: companySubscription.id
                }
            );
            return;
        }
    }

    await syncSubscriptionRecord(subscription, company.companySubscriptionId);
}

async function handleInvoicePaid(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = stripeCustomerId(invoice.customer);
    if (!customerId) return;

    const company = await prisma.company.findFirst({
        where: { stripeCustomerId: customerId },
        include: { plan: true, companySubscription: true }
    });

    if (!company) return;

    const subscriptionRef = invoice.parent?.subscription_details?.subscription;
    const subscriptionId =
        typeof subscriptionRef === 'string'
            ? subscriptionRef
            : subscriptionRef?.id;

    if (!company.companySubscriptionId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await applySubscriptionToCompany(subscription, {
            companyIdHint: subscription.metadata?.companyId,
            sendWelcomeEmail: false,
            writeAuditLog: false
        });
        return;
    }

    if (!company.companySubscriptionId) return;

    const lineItem = invoice.lines?.data?.[0];
    const priceRef = lineItem?.pricing?.price_details?.price;
    const legacyPrice = lineItem as
        | { price?: string | { id?: string } }
        | undefined;
    const priceId =
        typeof priceRef === 'string'
            ? priceRef
            : typeof legacyPrice?.price === 'string'
              ? legacyPrice.price
              : legacyPrice?.price?.id;

    let syncData: ReturnType<typeof buildSubscriptionSyncData> | null = null;

    if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        syncData = buildSubscriptionSyncData(subscription);
    }

    if (priceId && company.companySubscription) {
        const matchesCurrentPlan = await planMatchesStripePrice(
            company.plan,
            priceId
        );

        if (!matchesCurrentPlan) {
            const plan = await findPlanByStripePriceId(priceId);
            if (plan) {
                await prisma.company.update({
                    where: { id: company.id },
                    data: { planId: plan.id }
                });
            }
        }
    }

    await prisma.companySubscription.update({
        where: { id: company.companySubscriptionId },
        data: {
            ...(syncData ?? { status: 'active' }),
            ...(priceId ? { priceId } : {})
        }
    });
}

async function handleInvoicePaymentFailed(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = stripeCustomerId(invoice.customer);
    if (!customerId) return;

    const company = await prisma.company.findUnique({
        where: { stripeCustomerId: customerId },
        include: {
            companySubscription: true,
            creator: { select: { email: true, name: true } }
        }
    });

    if (!company?.companySubscriptionId) return;

    const previousStatus = company.companySubscription?.status;
    const wasAlreadyBlocked =
        previousStatus === 'past_due' || previousStatus === 'unpaid';

    await prisma.companySubscription.update({
        where: { id: company.companySubscriptionId },
        data: { status: 'past_due' }
    });

    if (wasAlreadyBlocked) {
        return;
    }

    const billingEmail =
        company.contactEmail || company.creator.email;

    try {
        const result = await sendPaymentFailedEmail({
            email: billingEmail,
            name: company.creator.name
        });
        if (!result.success) {
            console.error(
                '[stripe:webhook] Failed to send payment failed email:',
                result.error
            );
        }
    } catch (error) {
        console.error(
            '[stripe:webhook] Failed to send payment failed email:',
            error
        );
    }
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = stripeCustomerId(subscription.customer);
    if (!customerId) return;

    await prisma.companySubscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
            billingInterval: 'MONTHLY',
            currentPeriodEnd: null,
            nextBillingDate: null,
            status: 'canceled',
            cancelAtPeriodEnd: false,
            canceledAt: subscription.canceled_at
                ? new Date(subscription.canceled_at * 1000)
                : new Date()
        }
    });

    const freePlan = await prisma.plan.findFirst({ where: { level: 1 } });
    if (!freePlan) return;

    const company = await prisma.company.update({
        where: { stripeCustomerId: customerId },
        data: {
            planId: freePlan.id,
            companySubscriptionId: null
        }
    });

    await checkDowngradedPlan(company.id);

    await logSubscriptionCancel(
        getAuditUserId(subscription, company.creatorId) || company.creatorId,
        { companyId: company.id }
    );
}
