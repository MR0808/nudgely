import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import {
    type PlanStripeRefs,
    isFreePlan,
    resolvePlanStripePriceId
} from '@/lib/stripe-prices';
import { buildSubscriptionSyncData } from '@/lib/stripe-subscription';

export { isFreePlan } from '@/lib/stripe-prices';

export async function getStripePriceIdForPlan(
    plan: PlanStripeRefs,
    billingInterval: 'MONTHLY' | 'YEARLY'
): Promise<string | null> {
    if (isFreePlan(plan)) return null;
    return resolvePlanStripePriceId(plan, billingInterval);
}

export async function cancelStripeSubscription(
    subscriptionId: string
): Promise<void> {
    await stripe.subscriptions.cancel(subscriptionId);
}

export async function updateStripeSubscriptionPlan(
    subscriptionId: string,
    newPriceId: string,
    metadata: Record<string, string> = {}
): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const itemId = subscription.items.data[0]?.id;

    if (!itemId) {
        throw new Error(`Subscription ${subscriptionId} has no items`);
    }

    return stripe.subscriptions.update(subscriptionId, {
        items: [{ id: itemId, price: newPriceId }],
        proration_behavior: 'none',
        metadata: {
            ...subscription.metadata,
            ...metadata,
            adminPlanChange: 'true'
        }
    });
}

export function subscriptionSyncPayload(subscription: Stripe.Subscription) {
    return buildSubscriptionSyncData(subscription);
}
