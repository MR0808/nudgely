/**
 * Stripe live-mode validation (no charges created).
 *
 * Usage:
 *   npm run stripe:live:check
 *
 * Requires sk_live_ / pk_live_ and production NEXT_PUBLIC_APP_URL in .env
 */
import 'dotenv/config';

import { createDirectPrismaClient } from '../lib/create-prisma-client';
import {
    logResult,
    printLivePaymentTestSteps,
    validateAppUrl,
    validatePlanPrices,
    validatePublishableKey,
    validateSecretKey,
    validateWebhookEndpoints,
    validateWebhookSecret
} from './lib/stripe-check';

async function main() {
    console.log('Nudgely Stripe live-mode checklist (validation only)\n');
    console.log(
        '⚠️  Uses live API keys. This script does NOT create subscriptions or charges.\n'
    );

    const prisma = createDirectPrismaClient();
    const results = [
        validateSecretKey('live'),
        validatePublishableKey('live'),
        validateWebhookSecret(),
        validateAppUrl('live'),
        ...(await validatePlanPrices(prisma, 'live')),
        ...(await validateWebhookEndpoints('live'))
    ];

    await prisma.$disconnect();

    console.log('\n--- Results ---\n');
    for (const result of results) {
        logResult(result);
    }

    const failures = results.filter((result) => !result.ok);
    console.log(
        `\n${results.length - failures.length}/${results.length} checks passed`
    );

    printLivePaymentTestSteps();

    if (failures.length > 0) {
        process.exit(1);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
