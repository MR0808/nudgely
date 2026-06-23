/**
 * Post-deploy HTTP verification (minimal env required).
 *
 * Usage:
 *   npm run production:verify
 *   npm run production:verify -- https://app.nudgelyapp.com
 *
 * Checks /api/health on the deployed app. Pass URL as arg or set
 * PRODUCTION_URL / NEXT_PUBLIC_APP_URL in .env.
 */
import 'dotenv/config';

import {
    fetchProductionHealth,
    logResult
} from './lib/production-check';

async function main() {
    const baseUrl =
        process.argv[2]?.trim() ||
        process.env.PRODUCTION_URL?.trim() ||
        process.env.NEXT_PUBLIC_APP_URL?.trim();

    if (!baseUrl) {
        console.error(
            'Usage: npm run production:verify -- https://your-production-url.com'
        );
        process.exit(1);
    }

    console.log(`Verifying production deployment at ${baseUrl}\n`);

    const results = await fetchProductionHealth(baseUrl);

    console.log('\n--- Results ---\n');
    for (const result of results) {
        logResult(result);
    }

    const failures = results.filter((r) => !r.ok);
    if (failures.length > 0) {
        process.exit(1);
    }

    console.log('\nDeployment is responding. Run full checks with: npm run production:check');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
