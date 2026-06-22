import type Stripe from 'stripe';

export function stripeCustomerId(
    customer:
        | string
        | Stripe.Customer
        | Stripe.DeletedCustomer
        | null
        | undefined
): string | null {
    if (!customer) return null;
    if (typeof customer === 'string') return customer;
    if ('deleted' in customer && customer.deleted) return null;
    return customer.id;
}

export function getSubscriptionPriceId(
    subscription: Stripe.Subscription
): string {
    const item = subscription.items.data[0];
    if (!item?.price) {
        throw new Error(`Subscription ${subscription.id} has no price`);
    }

    return typeof item.price === 'string' ? item.price : item.price.id;
}

export function getSubscriptionPeriodEnd(
    subscription: Stripe.Subscription
): Date | null {
    const unix = subscription.items.data[0]?.current_period_end;
    return unix ? new Date(unix * 1000) : null;
}

export function getBillingIntervalFromSubscription(
    subscription: Stripe.Subscription
): 'MONTHLY' | 'YEARLY' {
    const interval = subscription.items.data[0]?.price?.recurring?.interval;
    return interval === 'year' ? 'YEARLY' : 'MONTHLY';
}

export function getAuditUserId(
    subscription: Stripe.Subscription,
    fallbackUserId?: string | null
): string | undefined {
    return subscription.metadata?.userId || fallbackUserId || undefined;
}

export function buildSubscriptionSyncData(subscription: Stripe.Subscription) {
    const periodEnd = getSubscriptionPeriodEnd(subscription);

    return {
        billingInterval: getBillingIntervalFromSubscription(subscription),
        priceId: getSubscriptionPriceId(subscription),
        status: subscription.status,
        currentPeriodEnd: periodEnd,
        nextBillingDate: periodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
        canceledAt: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000)
            : null,
    };
}

export function getCancellationEndDate(
    subscription: Stripe.Subscription
): Date | null {
    const periodEnd = getSubscriptionPeriodEnd(subscription);

    if (subscription.cancel_at_period_end && periodEnd) {
        return periodEnd;
    }

    if (subscription.cancel_at) {
        return new Date(subscription.cancel_at * 1000);
    }

    return periodEnd;
}

export function shouldSendCancellationEmail(
    subscription: Stripe.Subscription,
    previous?: Partial<Stripe.Subscription>
): boolean {
    if (
        subscription.cancel_at_period_end &&
        !previous?.cancel_at_period_end
    ) {
        return true;
    }

    if (subscription.cancel_at && subscription.cancel_at !== previous?.cancel_at) {
        return true;
    }

    return false;
}
