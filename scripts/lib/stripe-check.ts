/**
 * Shared Stripe validation helpers for test and live check scripts.
 */
import type { createDirectPrismaClient } from '../../lib/create-prisma-client';
import { stripe } from '../../lib/stripe';
import { isFreePlan, resolveStripePriceId } from '../../lib/stripe-prices';
import type Stripe from 'stripe';

export const REQUIRED_WEBHOOK_EVENTS = [
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'subscription_schedule.updated',
    'invoice.paid',
    'invoice.payment_failed'
] as const;

export type StripeCheckMode = 'test' | 'live';

export type CheckResult = { ok: boolean; message: string };

export function pass(message: string): CheckResult {
    return { ok: true, message };
}

export function fail(message: string): CheckResult {
    return { ok: false, message };
}

export function logResult(result: CheckResult) {
    console.log(`${result.ok ? '✓' : '✗'} ${result.message}`);
}

export function validateSecretKey(mode: StripeCheckMode): CheckResult {
    const key = process.env.STRIPE_SECRET_KEY;
    const expectedPrefix = mode === 'test' ? 'sk_test_' : 'sk_live_';

    if (!key) {
        return fail('STRIPE_SECRET_KEY is not set');
    }
    if (!key.startsWith(expectedPrefix)) {
        return fail(
            `STRIPE_SECRET_KEY must be a ${mode} key (${expectedPrefix}...)`
        );
    }
    return pass(`Stripe secret key is in ${mode} mode`);
}

export function validatePublishableKey(mode: StripeCheckMode): CheckResult {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    const expectedPrefix = mode === 'test' ? 'pk_test_' : 'pk_live_';

    if (!key) {
        return fail('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
    }
    if (!key.startsWith(expectedPrefix)) {
        return fail(
            `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must be a ${mode} key (${expectedPrefix}...)`
        );
    }
    return pass(`Stripe publishable key is in ${mode} mode`);
}

export function validateWebhookSecret(): CheckResult {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        return fail('STRIPE_WEBHOOK_SECRET is not set');
    }
    return pass('STRIPE_WEBHOOK_SECRET is configured');
}

export function validateAppUrl(mode: StripeCheckMode): CheckResult {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, '');
    if (!appUrl) {
        return fail('NEXT_PUBLIC_APP_URL is not set');
    }

    if (mode === 'live' && appUrl.includes('localhost')) {
        return fail(
            'NEXT_PUBLIC_APP_URL points to localhost — use your production URL for live checks'
        );
    }

    return pass(`NEXT_PUBLIC_APP_URL is ${appUrl}`);
}

export async function validatePlanPrices(
    prisma: ReturnType<typeof createDirectPrismaClient>,
    mode: StripeCheckMode
): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const plans = await prisma.plan.findMany({ orderBy: { level: 'asc' } });

    if (plans.length === 0) {
        return [fail('No plans found in the database')];
    }

    for (const plan of plans) {
        if (isFreePlan(plan)) {
            results.push(
                pass(`Plan "${plan.name}" is free — skipping Stripe price check`)
            );
            continue;
        }

        for (const [label, lookupKey] of [
            ['monthly', plan.stripeMonthlyLookup],
            ['yearly', plan.stripeYearlyLookup]
        ] as const) {
            if (!lookupKey) {
                results.push(
                    fail(`Plan "${plan.name}" is missing ${label} lookup key`)
                );
                continue;
            }

            try {
                const priceId = await resolveStripePriceId(lookupKey);
                const price = await stripe.prices.retrieve(priceId);

                if (!price.active) {
                    results.push(
                        fail(
                            `Plan "${plan.name}" ${label} lookup "${lookupKey}" → ${priceId} is inactive in ${mode} mode`
                        )
                    );
                } else {
                    results.push(
                        pass(
                            `Plan "${plan.name}" ${label} lookup "${lookupKey}" → ${priceId} is active (${mode})`
                        )
                    );
                }
            } catch {
                results.push(
                    fail(
                        `Plan "${plan.name}" ${label} lookup "${lookupKey}" not found in Stripe ${mode} mode`
                    )
                );
            }
        }
    }

    return results;
}

export async function validateWebhookEndpoints(
    mode: StripeCheckMode
): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, '');

    try {
        const endpoints = await stripe.webhookEndpoints.list({ limit: 20 });

        if (endpoints.data.length === 0) {
            results.push(
                fail(
                    mode === 'test'
                        ? 'No webhook endpoints in Stripe. Use `stripe listen` locally or add an endpoint in the dashboard.'
                        : 'No live webhook endpoints in Stripe. Add https://your-domain/api/stripe/webhook in the live dashboard.'
                )
            );
            return results;
        }

        const webhookPath = '/api/stripe/webhook';
        const matching = endpoints.data.filter((endpoint: Stripe.WebhookEndpoint) =>
            endpoint.url.includes(webhookPath)
        );

        if (appUrl) {
            const appMatch = matching.find((endpoint: Stripe.WebhookEndpoint) =>
                endpoint.url.startsWith(appUrl)
            );
            if (appMatch) {
                results.push(
                    pass(`Webhook endpoint found for ${appUrl}${webhookPath}`)
                );
            } else if (matching.length > 0) {
                results.push(
                    fail(
                        `Webhook endpoint found (${matching[0].url}) but it does not match NEXT_PUBLIC_APP_URL (${appUrl})`
                    )
                );
            } else {
                results.push(
                    fail(
                        `No webhook endpoint URL contains ${webhookPath}. Expected ${appUrl}${webhookPath}`
                    )
                );
            }
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
                    pass(
                        `Endpoint ${endpoint.id} has all required billing events`
                    )
                );
            } else {
                results.push(
                    fail(
                        `Endpoint ${endpoint.id} is missing events: ${missingEvents.join(', ')}`
                    )
                );
            }

            if (mode === 'live' && endpoint.status !== 'enabled') {
                results.push(
                    fail(`Endpoint ${endpoint.id} status is ${endpoint.status}`)
                );
            }
        }
    } catch (error) {
        results.push(fail(`Could not list webhook endpoints: ${error}`));
    }

    return results;
}

export async function runSubscriptionSmokeTest(
    prisma: ReturnType<typeof createDirectPrismaClient>
): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const paidPlan = await prisma.plan.findFirst({
        where: { level: { gt: 1 } },
        orderBy: { level: 'asc' }
    });

    if (!paidPlan || isFreePlan(paidPlan)) {
        return [
            fail('No paid plan found in database for subscription smoke test')
        ];
    }

    let customerId: string | null = null;
    let subscriptionId: string | null = null;

    try {
        const priceId = await resolveStripePriceId(paidPlan.stripeMonthlyLookup);
        const customer = await stripe.customers.create({
            email: `stripe-test+${Date.now()}@nudgely.local`,
            metadata: { source: 'nudgely-stripe-test-script' }
        });
        customerId = customer.id;

        const paymentMethod = await stripe.paymentMethods.attach('pm_card_visa', {
            customer: customerId
        });
        await stripe.customers.update(customerId, {
            invoice_settings: { default_payment_method: paymentMethod.id }
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
            success_url:
                'https://example.com/billing?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'https://example.com/billing'
        });

        if (!session.url) {
            results.push(fail('Checkout session was created but has no URL'));
        } else {
            results.push(
                pass(`Checkout session ${session.id} created successfully`)
            );
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: 'https://example.com/billing'
        });

        if (!portalSession.url) {
            results.push(
                fail('Billing portal session was created but has no URL')
            );
        } else {
            results.push(pass('Billing portal session created successfully'));
        }
    } catch (error) {
        results.push(fail(`Subscription smoke test failed: ${error}`));
    } finally {
        if (subscriptionId) {
            try {
                await stripe.subscriptions.cancel(subscriptionId);
                results.push(
                    pass(`Cancelled test subscription ${subscriptionId}`)
                );
            } catch (error) {
                results.push(
                    fail(
                        `Failed to cancel test subscription ${subscriptionId}: ${error}`
                    )
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

export function printLivePaymentTestSteps() {
    console.log('\n--- Manual live payment test (after deploy) ---\n');
    console.log('1. Deploy with live env vars on Vercel (sk_live_, pk_live_, live whsec_)');
    console.log('2. Log in as company admin on production');
    console.log('3. Billing → upgrade to Starter (lowest paid plan)');
    console.log('4. Complete Checkout with a real card');
    console.log('5. Confirm Billing shows active plan and Stripe Dashboard → Webhooks shows 2xx');
    console.log('6. Stripe Dashboard → Customers → cancel or refund the test subscription');
    console.log('7. Trigger invoice.payment_failed handling: use test clock in Stripe or a declining card on a throwaway sub');
    console.log('\nOptional: npm run stripe:sync-plans (with sk_live_ in .env) to cache live price IDs\n');
}
