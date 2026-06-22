import type { Plan } from '@/generated/prisma/client';

import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export function isFreePlan(plan: Pick<Plan, 'slug' | 'level'>): boolean {
    return plan.slug === 'free' || plan.level === 1;
}

export type PlanStripeRefs = Pick<
    Plan,
    | 'id'
    | 'slug'
    | 'level'
    | 'stripeMonthlyId'
    | 'stripeYearlyId'
    | 'stripeMonthlyLookup'
    | 'stripeYearlyLookup'
>;

const resolvedPriceCache = new Map<string, string>();

export function getPlanPriceLookupKey(
    plan: Pick<
        Plan,
        'stripeMonthlyLookup' | 'stripeYearlyLookup' | 'slug' | 'level'
    >,
    billingInterval: 'MONTHLY' | 'YEARLY'
): string | null {
    if (isFreePlan(plan)) return null;
    return billingInterval === 'YEARLY'
        ? plan.stripeYearlyLookup
        : plan.stripeMonthlyLookup;
}

export function clearStripePriceCache(): void {
    resolvedPriceCache.clear();
}

export async function resolveStripePriceId(
    lookupKey: string
): Promise<string> {
    const cached = resolvedPriceCache.get(lookupKey);
    if (cached) return cached;

    const prices = await stripe.prices.list({
        lookup_keys: [lookupKey],
        active: true,
        limit: 1
    });

    const priceId = prices.data[0]?.id;
    if (!priceId) {
        throw new Error(
            `No active Stripe price found for lookup key "${lookupKey}". ` +
                'Create the price in Stripe with this lookup key (test and live accounts each need their own prices).'
        );
    }

    resolvedPriceCache.set(lookupKey, priceId);
    return priceId;
}

export async function resolvePlanStripePriceId(
    plan: PlanStripeRefs,
    billingInterval: 'MONTHLY' | 'YEARLY'
): Promise<string> {
    const lookupKey = getPlanPriceLookupKey(plan, billingInterval);
    if (!lookupKey) {
        throw new Error(`Plan "${plan.slug}" has no Stripe price`);
    }

    try {
        return await resolveStripePriceId(lookupKey);
    } catch (error) {
        const fallback =
            billingInterval === 'YEARLY'
                ? plan.stripeYearlyId
                : plan.stripeMonthlyId;

        if (fallback?.startsWith('price_')) {
            return fallback;
        }

        throw error;
    }
}

export async function findPlanByStripePriceId(priceId: string) {
    const direct = await prisma.plan.findFirst({
        where: {
            OR: [
                { stripeMonthlyId: priceId },
                { stripeYearlyId: priceId }
            ]
        }
    });

    if (direct) return direct;

    try {
        const price = await stripe.prices.retrieve(priceId);
        if (!price.lookup_key) return null;

        return prisma.plan.findFirst({
            where: {
                OR: [
                    { stripeMonthlyLookup: price.lookup_key },
                    { stripeYearlyLookup: price.lookup_key }
                ]
            }
        });
    } catch {
        return null;
    }
}

export async function planMatchesStripePrice(
    plan: PlanStripeRefs,
    priceId: string
): Promise<boolean> {
    if (
        priceId === plan.stripeMonthlyId ||
        priceId === plan.stripeYearlyId
    ) {
        return true;
    }

    try {
        const price = await stripe.prices.retrieve(priceId);
        if (!price.lookup_key) return false;

        return (
            price.lookup_key === plan.stripeMonthlyLookup ||
            price.lookup_key === plan.stripeYearlyLookup
        );
    } catch {
        return false;
    }
}

export async function isYearlyStripePriceId(priceId: string): Promise<boolean> {
    try {
        const price = await stripe.prices.retrieve(priceId);
        if (price.lookup_key) {
            const plan = await prisma.plan.findFirst({
                where: { stripeYearlyLookup: price.lookup_key }
            });
            if (plan) return true;
        }
    } catch {
        // fall through to DB ID match
    }

    const plan = await prisma.plan.findFirst({
        where: { stripeYearlyId: priceId }
    });
    return plan !== null;
}
