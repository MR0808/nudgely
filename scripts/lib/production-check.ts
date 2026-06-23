export type CheckResult = { ok: boolean; message: string };

export function pass(message: string): CheckResult {
    return { ok: true, message };
}

export function fail(message: string): CheckResult {
    return { ok: false, message };
}

export function warn(message: string): CheckResult {
    return { ok: true, message: `⚠ ${message}` };
}

export function logResult(result: CheckResult) {
    const prefix = result.message.startsWith('⚠')
        ? '!'
        : result.ok
          ? '✓'
          : '✗';
    console.log(`${prefix} ${result.message}`);
}

const REQUIRED_ENV = [
    'DATABASE_URL',
    'DIRECT_DATABASE_URL',
    'BETTER_AUTH_SECRET',
    'BETTER_AUTH_URL',
    'NEXT_PUBLIC_APP_URL',
    'CRON_SECRET',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'RESEND_WEBHOOK_SECRET',
    'NEXT_PUBLIC_APP_EMAIL',
    'NEXT_PUBLIC_APP_EMAIL_SUPPORT'
] as const;

const RECOMMENDED_ENV = ['ADMIN_EMAIL', 'SENTRY_AUTH_TOKEN'] as const;

const SUPABASE_PAIRS: Array<[string, string]> = [
    ['SUPABASE_URL', 'SUPABASE_KEY'],
    ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
];

export function validateRequiredEnv(): CheckResult[] {
    const results: CheckResult[] = [];

    for (const key of REQUIRED_ENV) {
        const value = process.env[key]?.trim();
        if (!value) {
            results.push(fail(`${key} is not set`));
        } else {
            results.push(pass(`${key} is set`));
        }
    }

    const hasSupabase = SUPABASE_PAIRS.some(
        ([urlKey, keyKey]) =>
            Boolean(process.env[urlKey]?.trim()) &&
            Boolean(process.env[keyKey]?.trim())
    );
    if (!hasSupabase) {
        results.push(
            fail(
                'Supabase not configured — set SUPABASE_URL + SUPABASE_KEY or NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY'
            )
        );
    } else {
        results.push(pass('Supabase credentials are set'));
    }

    for (const key of RECOMMENDED_ENV) {
        if (!process.env[key]?.trim()) {
            results.push(warn(`${key} is not set (recommended for production)`));
        } else {
            results.push(pass(`${key} is set`));
        }
    }

    return results;
}

export function normalizeAppUrl(url: string): string {
    return url.trim().replace(/\/+$/, '');
}

export function validateProductionKeyPrefixes(): CheckResult[] {
    const results: CheckResult[] = [];

    const sk = process.env.STRIPE_SECRET_KEY ?? '';
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

    if (sk.startsWith('sk_test_')) {
        results.push(fail('STRIPE_SECRET_KEY is still sk_test_ — use sk_live_ on production'));
    } else if (sk.startsWith('sk_live_')) {
        results.push(pass('STRIPE_SECRET_KEY is live mode'));
    } else if (sk) {
        results.push(fail('STRIPE_SECRET_KEY format unrecognized'));
    }

    if (pk.startsWith('pk_test_')) {
        results.push(
            fail('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is still pk_test_ — use pk_live_ on production')
        );
    } else if (pk.startsWith('pk_live_')) {
        results.push(pass('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is live mode'));
    } else if (pk) {
        results.push(fail('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY format unrecognized'));
    }

    const appUrl = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL ?? '');
    if (appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
        results.push(fail('NEXT_PUBLIC_APP_URL still points to localhost'));
    } else if (appUrl.startsWith('https://')) {
        results.push(pass(`NEXT_PUBLIC_APP_URL is ${appUrl}`));
    } else if (appUrl) {
        results.push(warn('NEXT_PUBLIC_APP_URL should use https:// in production'));
    }

    const authUrl = normalizeAppUrl(process.env.BETTER_AUTH_URL ?? '');
    if (authUrl.includes('localhost')) {
        results.push(fail('BETTER_AUTH_URL still points to localhost'));
    } else if (authUrl.startsWith('https://')) {
        results.push(pass(`BETTER_AUTH_URL is ${authUrl}`));
    }

    if (authUrl && appUrl && authUrl !== appUrl) {
        const hostA = new URL(authUrl).hostname;
        const hostB = new URL(appUrl).hostname;
        const typoHint =
            hostA.replace(/[^a-z]/g, '') === hostB.replace(/[^a-z]/g, '')
                ? ''
                : ' — check for typos in the hostname';
        results.push(
            fail(
                `BETTER_AUTH_URL (${authUrl}) and NEXT_PUBLIC_APP_URL (${appUrl}) must match${typoHint}`
            )
        );
    }

    const secret = process.env.BETTER_AUTH_SECRET ?? '';
    if (secret.length > 0 && secret.length < 32) {
        results.push(warn('BETTER_AUTH_SECRET should be at least 32 characters'));
    } else if (secret.length >= 32) {
        results.push(pass('BETTER_AUTH_SECRET length looks adequate'));
    }

    const cronSecret = process.env.CRON_SECRET ?? '';
    if (cronSecret.length > 0 && cronSecret.length < 16) {
        results.push(warn('CRON_SECRET should be at least 16 characters'));
    } else if (cronSecret.length >= 16) {
        results.push(pass('CRON_SECRET length looks adequate'));
    }

    if (process.env.DATABASE_URL?.startsWith('prisma+')) {
        results.push(pass('DATABASE_URL uses Prisma Accelerate'));
    } else if (process.env.DATABASE_URL) {
        results.push(warn('DATABASE_URL is not an Accelerate URL — confirm this is intentional'));
    }

    return results;
}

export async function validateDatabaseReadiness(
    prisma: {
        plan: { count: () => Promise<number> };
        user: { count: () => Promise<number> };
        $queryRaw: (query: TemplateStringsArray) => Promise<unknown>;
    }
): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    try {
        await prisma.$queryRaw`SELECT 1`;
        results.push(pass('Database connection (DIRECT_DATABASE_URL) works'));
    } catch (error) {
        results.push(
            fail(
                `Database connection failed — check DIRECT_DATABASE_URL: ${error instanceof Error ? error.message : error}`
            )
        );
        return results;
    }

    const planCount = await prisma.plan.count();
    if (planCount === 0) {
        results.push(
            fail(
                'No plans in database — run `npm run db:seed:reference` against production DB'
            )
        );
    } else {
        results.push(pass(`Database has ${planCount} plan(s)`));
    }

    const userCount = await prisma.user.count();
    results.push(pass(`Database has ${userCount} user(s)`));

    return results;
}

export async function fetchProductionHealth(
    baseUrl: string
): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const url = `${baseUrl.replace(/\/$/, '')}/api/health`;

    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(15000)
        });
        const body = (await response.json()) as { status?: string };

        if (response.ok && body.status === 'ok') {
            results.push(pass(`Production health check OK (${url})`));
        } else {
            results.push(
                fail(
                    `Production health check failed (${response.status}): ${JSON.stringify(body)}`
                )
            );
        }
    } catch (error) {
        results.push(
            fail(
                `Could not reach ${url}: ${error instanceof Error ? error.message : error}`
            )
        );
    }

    return results;
}
