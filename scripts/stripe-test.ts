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
import {
    logResult,
    runSubscriptionSmokeTest,
    validateAppUrl,
    validatePlanPrices,
    validatePublishableKey,
    validateSecretKey,
    validateWebhookEndpoints,
    validateWebhookSecret
} from './lib/stripe-check';

async function main() {
    const checkOnly = process.argv.includes('--check-only');

    console.log(
        checkOnly
            ? 'Nudgely Stripe test-mode check (validation only)\n'
            : 'Nudgely Stripe test-mode check + smoke test\n'
    );

    const prisma = createDirectPrismaClient();
    const allResults = [
        validateSecretKey('test'),
        validatePublishableKey('test'),
        validateWebhookSecret(),
        validateAppUrl('test'),
        ...(await validatePlanPrices(prisma, 'test')),
        ...(await validateWebhookEndpoints('test'))
    ];

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
        console.log(
            'Before production: `npm run stripe:live:check` with live keys in .env'
        );
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
