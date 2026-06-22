import type Stripe from 'stripe';

import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import {
    logSubscriptionCreate,
    logSubscriptionUpdate
} from '@/actions/audit/audit-subscription';
import { sendUpgradeEmail } from '@/lib/mail';
import { findPlanByStripePriceId } from '@/lib/stripe-prices';
import {
    buildSubscriptionSyncData,
    getAuditUserId,
    getSubscriptionPriceId,
    isAdminPlanChange,
    stripeCustomerId
} from '@/lib/stripe-subscription';

async function resolveCompanyForSubscription(
    subscription: Stripe.Subscription,
    companyIdHint?: string | null
) {
    const customerId = stripeCustomerId(subscription.customer);
    const metadataCompanyId = subscription.metadata?.companyId;

    if (companyIdHint) {
        const byId = await prisma.company.findUnique({
            where: { id: companyIdHint },
            include: { creator: true, companySubscription: true, plan: true }
        });
        if (byId) return byId;
    }

    if (customerId) {
        const byCustomer = await prisma.company.findUnique({
            where: { stripeCustomerId: customerId },
            include: { creator: true, companySubscription: true, plan: true }
        });
        if (byCustomer) return byCustomer;
    }

    if (metadataCompanyId) {
        return prisma.company.findUnique({
            where: { id: metadataCompanyId },
            include: { creator: true, companySubscription: true, plan: true }
        });
    }

    return null;
}

export async function applySubscriptionToCompany(
    subscription: Stripe.Subscription,
    options: {
        companyIdHint?: string | null;
        sendWelcomeEmail?: boolean;
        writeAuditLog?: boolean;
    } = {}
) {
    const {
        companyIdHint,
        sendWelcomeEmail = true,
        writeAuditLog = true
    } = options;

    const customerId = stripeCustomerId(subscription.customer);
    const priceId = getSubscriptionPriceId(subscription);
    const plan = await findPlanByStripePriceId(priceId);

    if (!plan) {
        throw new Error(`No plan found for Stripe price ${priceId}`);
    }

    const company = await resolveCompanyForSubscription(
        subscription,
        companyIdHint
    );

    if (!company) {
        throw new Error(
            `No company found for subscription ${subscription.id} (customer ${customerId ?? 'unknown'})`
        );
    }

    if (customerId && company.stripeCustomerId !== customerId) {
        await prisma.company.update({
            where: { id: company.id },
            data: { stripeCustomerId: customerId }
        });
    }

    const syncData = buildSubscriptionSyncData(subscription);
    const isNewSubscription = !company.companySubscriptionId;
    const planChanged = company.planId !== plan.id;
    const alreadySynced =
        company.companySubscription?.stripeSubscriptionId === subscription.id &&
        company.planId === plan.id &&
        !planChanged;

    let companySubscription = company.companySubscription;

    if (companySubscription) {
        companySubscription = await prisma.companySubscription.update({
            where: { id: companySubscription.id },
            data: {
                stripeSubscriptionId: subscription.id,
                ...syncData
            }
        });
    } else {
        companySubscription = await prisma.companySubscription.create({
            data: {
                stripeSubscriptionId: subscription.id,
                ...syncData,
                company: { connect: { id: company.id } }
            }
        });
    }

    await prisma.company.update({
        where: { id: company.id },
        data: { planId: plan.id }
    });

    if (
        sendWelcomeEmail &&
        !alreadySynced &&
        !isAdminPlanChange(subscription) &&
        (isNewSubscription || planChanged)
    ) {
        await sendUpgradeEmail({
            email: company.contactEmail || company.creator.email,
            name: company.creator.name,
            plan: plan.name
        });
    }

    if (writeAuditLog && !alreadySynced) {
        const auditUserId =
            getAuditUserId(subscription, company.creatorId) ||
            company.creatorId;

        if (isNewSubscription) {
            await logSubscriptionCreate(auditUserId, {
                companyId: company.id,
                companySubscription: companySubscription.id
            });
        } else if (planChanged) {
            await logSubscriptionUpdate(auditUserId, {
                companyId: company.id,
                oldPlan: company.planId,
                companySubscription: companySubscription.id
            });
        }
    }

    return { company, companySubscription, plan };
}

export async function syncCheckoutSessionToCompany(
    checkoutSessionId: string,
    options: {
        companyIdHint?: string;
        sendWelcomeEmail?: boolean;
        writeAuditLog?: boolean;
    } = {}
) {
    const {
        companyIdHint,
        sendWelcomeEmail = true,
        writeAuditLog = true
    } = options;

    const checkoutSession =
        await stripe.checkout.sessions.retrieve(checkoutSessionId);

    const companyId =
        companyIdHint || checkoutSession.client_reference_id || undefined;
    const customerId = stripeCustomerId(checkoutSession.customer);

    if (companyId && customerId) {
        await prisma.company.update({
            where: { id: companyId },
            data: { stripeCustomerId: customerId }
        });
    }

    const subscriptionId =
        typeof checkoutSession.subscription === 'string'
            ? checkoutSession.subscription
            : checkoutSession.subscription?.id;

    if (!subscriptionId) {
        return null;
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    return applySubscriptionToCompany(subscription, {
        companyIdHint: companyId,
        sendWelcomeEmail,
        writeAuditLog
    });
}
