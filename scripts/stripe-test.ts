/**
 * Stripe test-mode validation and smoke test.
 *
 * Usage:
 *   npm run stripe:test          # validate + create/cancel a test subscription
 *   npm run stripe:test:check    # validate only (no Stripe objects created)
 *
 * Requires STRIPE_SECRET_KEY=sk_test_... and DIRECT_DATABASE_URL (or DATABASE_URL).
 */
import 'dotenv/config';

import { createDirectPrismaClient } from '../lib/create-prisma-client';
import { stripe } from '../lib/stripe';
import { isFreePlan } from '../lib/stripe-admin';

const REQUIRED_WEBHOOK_EVENTS = [
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'subscription_schedule.updated',
    'invoice.paid',
    'invoice.payment_failed'
] as const;

type Result = { ok: boolean; message: string };

function pass(message: string): Result {
    return { ok: true, message };
}

function fail(message: string): Result {
    return { ok: false, message };
}

function logResult(result: Result) {
    console.log(`${result.ok ? '✓' : '✗'} ${result.message}`);
}

async function validateTestModeKey(): Promise<Result> {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        return fail('STRIPE_SECRET_KEY is not set');
    }
    if (!key.startsWith('sk_test_')) {
        return fail(
            'STRIPE_SECRET_KEY must be a test key (sk_test_...). Refusing to run against live mode.'
        );
    }
    return pass('Stripe secret key is in test mode');
}

async function validatePublishableKey(): Promise<Result> {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
        return fail('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
    }
    if (!key.startsWith('pk_test_')) {
        return fail('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY should be a test key (pk_test_...)');
    }
    return pass('Stripe publishable key is in test mode');
}

async function validateWebhookSecret(): Promise<Result> {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        return fail('STRIPE_WEBHOOK_SECRET is not set');
    }
    return pass('STRIPE_WEBHOOK_SECRET is configured');
}

async function validatePlanPrices(
    prisma: ReturnType<typeof createDirectPrismaClient>
): Promise<Result[]> {
    const results: Result[] = [];
    const plans = await prisma.plan.findMany({ orderBy: { level: 'asc' } });

    if (plans.length === 0) {
        return [fail('No plans found in the database')];
    }

    for (const plan of plans) {
        if (isFreePlan(plan)) {
            results.push(pass(`Plan "${plan.name}" is free — skipping Stripe price check`));
            continue;
        }

        for (const [label, priceId] of [
            ['monthly', plan.stripeMonthlyId],
            ['yearly', plan.stripeYearlyId]
        ] as const) {
            if (!priceId) {
                results.push(fail(`Plan "${plan.name}" is missing ${label} Stripe price ID`));
                continue;
            }

            try {
                const price = await stripe.prices.retrieve(priceId);
                if (!price.active) {
                    results.push(
                        fail(`Plan "${plan.name}" ${label} price ${priceId} exists but is inactive`)
                    );
                } else {
                    results.push(
                        pass(`Plan "${plan.name}" ${label} price ${priceId} is active`)
                    );
                }
            } catch {
                results.push(
                    fail(`Plan "${plan.name}" ${label} price ${priceId} not found in Stripe`)
                );
            }
        }
    }

    return results;
}

async function validateWebhookEndpoints(): Promise<Result[]> {
    const results: Result[] = [];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    try {
        const endpoints = await stripe.webhookEndpoints.list({ limit: 20 });

        if (endpoints.data.length === 0) {
            results.push(
                fail(
                    'No webhook endpoints configured in Stripe. Use `stripe listen` locally or add an endpoint in the Stripe dashboard.'
                )
            );
            return results;
        }

        const webhookPath = '/api/stripe/webhook';
        const matching = endpoints.data.filter((endpoint) =>
            endpoint.url.includes(webhookPath)
        );

        if (appUrl) {
            const appMatch = matching.find((endpoint) =>
                endpoint.url.startsWith(appUrl)
            );
            if (appMatch) {
                results.push(
                    pass(`Webhook endpoint found for ${appUrl}${webhookPath}`)
                );
            } else if (matching.length > 0) {
                results.push(
                    pass(
                        `Webhook endpoint found (${matching[0].url}) but it does not match NEXT_PUBLIC_APP_URL`
                    )
                );
            } else {
                results.push(
                    fail(
                        `No webhook endpoint URL contains ${webhookPath}. Configure one in Stripe or run \`stripe listen --forward-to localhost:3000/api/stripe/webhook\``
                    )
                );
            }
        } else {
            results.push(
                pass(
                    `Found ${endpoints.data.length} webhook endpoint(s) in Stripe (NEXT_PUBLIC_APP_URL not set for URL match)`
                )
            );
        }

        for (const endpoint of matching.length > 0 ? matching : endpoints.data) {
            const missingEvents = REQUIRED_WEBHOOK_EVENTS.filter(
                (event) => !endpoint.enabled_events.includes(event)
            );

            if (endpoint.enabled_events.includes('*')) {
                results.push(
                    pass(`Endpoint ${endpoint.id} listens to all events`)
                );
            } else if (missingEvents.length === 0) {
                results.push(
                    pass(`Endpoint ${endpoint.id} has all required billing events`)
                );
            } else {
                results.push(
                    fail(
                        `Endpoint ${endpoint.id} is missing events: ${missingEvents.join(', ')}`
                    )
                );
            }
        }
    } catch (error) {
        results.push(fail(`Could not list webhook endpoints: ${error}`));
    }

    return results;
}

async function runSubscriptionSmokeTest(
    prisma: ReturnType<typeof createDirectPrismaClient>
): Promise<Result[]> {
    const results: Result[] = [];
    const paidPlan = await prisma.plan.findFirst({
        where: { level: { gt: 1 } },
        orderBy: { level: 'asc' }
    });

    if (!paidPlan || isFreePlan(paidPlan)) {
        return [fail('No paid plan found in database for subscription smoke test')];
    }

    const priceId = paidPlan.stripeMonthlyId;
    if (!priceId) {
        return [fail(`Paid plan "${paidPlan.name}" has no monthly Stripe price ID`)];
    }

    let customerId: string | null = null;
    let subscriptionId: string | null = null;

    try {
        const customer = await stripe.customers.create({
            email: `stripe-test+${Date.now()}@nudgely.local`,
            metadata: { source: 'nudgely-stripe-test-script' }
        });
        customerId = customer.id;

        await stripe.paymentMethods.attach('pm_card_visa', {
            customer: customerId
        });
        await stripe.customers.update(customerId, {
            invoice_settings: { default_payment_method: 'pm_card_visa' }
        });

        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            metadata: { source: 'nudgely-stripe-test-script' }
        });
        subscriptionId = subscription.id;

        results.push(
            pass(
                `Created test subscription ${subscription.id} on plan "${paidPlan.name}" (${priceId})`
            )
        );

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: 'https://example.com/billing?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'https://example.com/billing'
        });

        if (!session.url) {
            results.push(fail('Checkout session was created but has no URL'));
        } else {
            results.push(pass(`Checkout session ${session.id} created successfully`));
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: 'https://example.com/billing'
        });

        if (!portalSession.url) {
            results.push(fail('Billing portal session was created but has no URL'));
        } else {
            results.push(pass('Billing portal session created successfully'));
        }
    } catch (error) {
        results.push(fail(`Subscription smoke test failed: ${error}`));
    } finally {
        if (subscriptionId) {
            try {
                await stripe.subscriptions.cancel(subscriptionId);
                results.push(pass(`Cancelled test subscription ${subscriptionId}`));
            } catch (error) {
                results.push(
                    fail(`Failed to cancel test subscription ${subscriptionId}: ${error}`)
                );
            }
        }

        if (customerId) {
            try {
                await stripe.customers.del(customerId);
                results.push(pass(`Deleted test customer ${customerId}`));
            } catch (error) {
                results.push(
                    fail(`Failed to delete test customer ${customerId}: ${error}`)
                );
            }
        }
    }

    return results;
}

async function main() {
    const checkOnly = process.argv.includes('--check-only');

    console.log(
        checkOnly
            ? 'Nudgely Stripe test-mode check (validation only)\n'
            : 'Nudgely Stripe test-mode check + smoke test\n'
    );

    const prisma = createDirectPrismaClient();
    const allResults: Result[] = [];

    allResults.push(await validateTestModeKey());
    allResults.push(await validatePublishableKey());
    allResults.push(await validateWebhookSecret());
    allResults.push(...(await validatePlanPrices(prisma)));
    allResults.push(...(await validateWebhookEndpoints()));

    if (!checkOnly) {
        console.log('\nRunning subscription smoke test...\n');
        allResults.push(...(await runSubscriptionSmokeTest(prisma)));
    }

    await prisma.$disconnect();

    console.log('\n--- Results ---\n');
    for (const result of allResults) {
        logResult(result);
    }

    const failures = allResults.filter((result) => !result.ok);
    console.log(
        `\n${allResults.length - failures.length}/${allResults.length} checks passed`
    );

    if (failures.length > 0) {
        process.exit(1);
    }

    if (checkOnly) {
        console.log(
            '\nTip: run `npm run stripe:test` for a full smoke test (creates and cleans up a test subscription).'
        );
        console.log(
            'Local webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`'
        );
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
