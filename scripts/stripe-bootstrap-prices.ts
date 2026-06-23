/**
 * Create Stripe products/prices with lookup keys from plan rows (idempotent).
 *
 * Usage:
 *   npm run stripe:bootstrap-prices        # uses STRIPE_SECRET_KEY from .env
 *   npm run stripe:bootstrap-prices -- --dry-run
 *
 * Run once per Stripe mode (test and live each need their own prices).
 * Then: npm run stripe:sync-plans
 */
import 'dotenv/config';

import { createDirectPrismaClient } from '../lib/create-prisma-client';
import { isFreePlan, resolveStripePriceId } from '../lib/stripe-prices';
import { stripe } from '../lib/stripe';

const dryRun = process.argv.includes('--dry-run');

async function priceExists(lookupKey: string): Promise<boolean> {
    try {
        await resolveStripePriceId(lookupKey);
        return true;
    } catch {
        return false;
    }
}

async function ensurePrice(
    productId: string,
    planName: string,
    lookupKey: string,
    unitAmountCents: number,
    interval: 'month' | 'year'
): Promise<void> {
    if (await priceExists(lookupKey)) {
        console.log(`  ✓ ${lookupKey} already exists`);
        return;
    }

    const label = `$${(unitAmountCents / 100).toFixed(2)}/${interval}`;
    if (dryRun) {
        console.log(`  → would create ${lookupKey} (${label})`);
        return;
    }

    const price = await stripe.prices.create({
        product: productId,
        currency: 'usd',
        unit_amount: unitAmountCents,
        recurring: { interval },
        lookup_key: lookupKey,
        transfer_lookup_key: true,
        metadata: { plan: planName, source: 'nudgely-stripe-bootstrap' }
    });

    console.log(`  + created ${lookupKey} → ${price.id} (${label})`);
}

async function main() {
    const mode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')
        ? 'live'
        : 'test';

    console.log(
        `Bootstrapping Stripe prices (${mode} mode)${dryRun ? ' [dry-run]' : ''}\n`
    );

    if (mode === 'live' && !dryRun) {
        console.log(
            '⚠️  Creating real live Stripe products/prices. Ctrl+C to abort.\n'
        );
    }

    const prisma = createDirectPrismaClient();
    const plans = await prisma.plan.findMany({ orderBy: { level: 'asc' } });

    for (const plan of plans) {
        if (isFreePlan(plan)) {
            console.log(`• ${plan.name}: skipped (free)`);
            continue;
        }

        console.log(`• ${plan.name}`);

        let productId: string | undefined;

        if (!dryRun) {
            const existing = await stripe.products.search({
                query: `metadata['nudgely_plan_slug']:'${plan.slug}'`,
                limit: 1
            });

            if (existing.data[0]) {
                productId = existing.data[0].id;
                console.log(`  ✓ product ${productId}`);
            } else {
                const product = await stripe.products.create({
                    name: `Nudgely ${plan.name}`,
                    metadata: {
                        nudgely_plan_slug: plan.slug,
                        source: 'nudgely-stripe-bootstrap'
                    }
                });
                productId = product.id;
                console.log(`  + product ${productId}`);
            }
        }

        const yearlyTotalCents = plan.priceYearly * 12;

        if (dryRun) {
            await ensurePrice(
                'prod_dry_run',
                plan.name,
                plan.stripeMonthlyLookup,
                plan.priceMonthly,
                'month'
            );
            await ensurePrice(
                'prod_dry_run',
                plan.name,
                plan.stripeYearlyLookup,
                yearlyTotalCents,
                'year'
            );
            continue;
        }

        await ensurePrice(
            productId!,
            plan.name,
            plan.stripeMonthlyLookup,
            plan.priceMonthly,
            'month'
        );
        await ensurePrice(
            productId!,
            plan.name,
            plan.stripeYearlyLookup,
            yearlyTotalCents,
            'year'
        );
    }

    await prisma.$disconnect();

    console.log('\nDone.');
    if (!dryRun) {
        console.log('Next: npm run stripe:sync-plans');
        console.log('Then: npm run production:check');
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
