/**
 * Resolve Stripe price IDs from lookup keys and cache them on the plans table.
 *
 * Usage:
 *   npm run stripe:sync-plans
 *
 * Run after creating prices in Stripe (test or live — uses STRIPE_SECRET_KEY).
 */
import 'dotenv/config';

import { createDirectPrismaClient } from '../lib/create-prisma-client';
import {
    clearStripePriceCache,
    resolveStripePriceId
} from '../lib/stripe-prices';
import { isFreePlan } from '../lib/stripe-prices';

async function main() {
    const mode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')
        ? 'live'
        : 'test';

    console.log(`Syncing plan Stripe price IDs (${mode} mode)...\n`);

    clearStripePriceCache();
    const prisma = createDirectPrismaClient();
    const plans = await prisma.plan.findMany({ orderBy: { level: 'asc' } });

    for (const plan of plans) {
        if (isFreePlan(plan)) {
            console.log(`• ${plan.name}: skipped (free plan)`);
            continue;
        }

        const monthlyId = await resolveStripePriceId(plan.stripeMonthlyLookup);
        const yearlyId = await resolveStripePriceId(plan.stripeYearlyLookup);

        await prisma.plan.update({
            where: { id: plan.id },
            data: {
                stripeMonthlyId: monthlyId,
                stripeYearlyId: yearlyId
            }
        });

        console.log(`• ${plan.name}`);
        console.log(`    ${plan.stripeMonthlyLookup} → ${monthlyId}`);
        console.log(`    ${plan.stripeYearlyLookup} → ${yearlyId}`);
    }

    await prisma.$disconnect();
    console.log('\nDone. Price IDs cached on plans for this Stripe mode.');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
