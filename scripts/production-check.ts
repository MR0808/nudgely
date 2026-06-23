/**
 * Pre-deploy production readiness check (run locally with production .env).
 *
 * Usage:
 *   npm run production:check
 *
 * Loads .env, validates env vars, DB, and Stripe live configuration.
 * Does NOT create charges or send emails.
 *
 * Tip: copy production values from Vercel into a local .env.production.local
 * or temporarily point .env at production credentials before running.
 */
import 'dotenv/config';

import { createDirectPrismaClient } from '../lib/create-prisma-client';
import {
    logResult,
    validateAppUrl,
    validatePlanPrices,
    validatePublishableKey,
    validateSecretKey,
    validateWebhookEndpoints,
    validateWebhookSecret
} from './lib/stripe-check';
import {
    fetchProductionHealth,
    validateDatabaseReadiness,
    validateProductionKeyPrefixes,
    validateRequiredEnv
} from './lib/production-check';

async function main() {
    console.log('Nudgely production readiness check\n');
    console.log(
        'Validates environment, database, and Stripe live config. No charges created.\n'
    );

    const results = [
        ...validateRequiredEnv(),
        ...validateProductionKeyPrefixes()
    ];

    const prisma = createDirectPrismaClient();

    try {
        results.push(...(await validateDatabaseReadiness(prisma)));

        results.push(
            validateSecretKey('live'),
            validatePublishableKey('live'),
            validateWebhookSecret(),
            validateAppUrl('live'),
            ...(await validatePlanPrices(prisma, 'live')),
            ...(await validateWebhookEndpoints('live'))
        );
    } finally {
        await prisma.$disconnect();
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (appUrl && !appUrl.includes('localhost')) {
        console.log('\nChecking deployed health endpoint...\n');
        results.push(...(await fetchProductionHealth(appUrl)));
    } else {
        results.push({
            ok: true,
            message:
                '⚠ Skipping live health check — set NEXT_PUBLIC_APP_URL to production URL'
        });
    }

    console.log('\n--- Results ---\n');
    for (const result of results) {
        logResult(result);
    }

    const failures = results.filter((r) => !r.ok);
    const warnings = results.filter((r) => r.message.startsWith('⚠'));

    console.log(
        `\n${results.length - failures.length}/${results.length} checks passed`
    );
    if (warnings.length > 0) {
        console.log(`${warnings.length} warning(s)`);
    }

    if (failures.length > 0) {
        console.log('\nFix failures above before deploying to production.');
        process.exit(1);
    }

    console.log('\n--- Manual steps after deploy ---\n');
    console.log('1. Stripe Dashboard → Webhooks → confirm 2xx on live endpoint');
    console.log('2. One real Starter checkout → verify billing page → cancel/refund');
    console.log('3. Resend → test bounce webhook to /api/resend/webhook');
    console.log('4. Vercel → Cron Jobs → confirm 200 after next scheduled run');
    console.log('5. Admin → Cron → run send-nudges manually once');
    console.log('6. Set up uptime monitor on /api/health');
    console.log('7. Remove /sentry-example-page if still present before marketing launch');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
