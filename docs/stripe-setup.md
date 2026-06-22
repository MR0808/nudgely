# Stripe setup run sheet (test + production)

Nudgely resolves Stripe prices by **lookup key** (`starter_monthly`, `growth_yearly`, etc.), not hardcoded `price_xxx` IDs. The same lookup keys are used in both Stripe test and live accounts — only your API keys change between environments.

---

## How it works

| Layer | What you configure |
|--------|-------------------|
| **Database (`plans`)** | Stable lookup keys: `stripeMonthlyLookup`, `stripeYearlyLookup` |
| **Stripe (test + live)** | One product/price per lookup key, per account |
| **App (`.env` / Vercel)** | `STRIPE_SECRET_KEY`, publishable key, webhook secret |
| **Optional cache** | `stripeMonthlyId` / `stripeYearlyId` on `plans` — updated by `npm run stripe:sync-plans` |

At checkout the app calls Stripe with the lookup key and uses the `price_xxx` returned for the current API key mode.

---

## Lookup keys (must match in test and live)

Create these prices in **both** Stripe dashboards:

| Plan | Monthly lookup key | Yearly lookup key |
|------|-------------------|-------------------|
| Starter | `starter_monthly` | `starter_yearly` |
| Growth | `growth_monthly` | `growth_yearly` |
| Scale | `scale_monthly` | `scale_yearly` |

Free plan has no Stripe prices.

Verify keys in your DB:

```sql
SELECT slug, "stripeMonthlyLookup", "stripeYearlyLookup" FROM plans ORDER BY level;
```

---

## Part 1 — Stripe Dashboard (do once per mode: Test, then Live)

### 1.1 Create products and prices

For **each paid plan** (Starter, Growth, Scale):

1. Stripe Dashboard → **Products** → **Add product**
2. Name: e.g. `Nudgely Starter`
3. Add **two recurring prices** (monthly and yearly) matching your DB `priceMonthly` / `priceYearly` display amounts
4. For each price, set **Lookup key** exactly as in the table above  
   (Price → ⋮ → Edit → Lookup key, or set when creating)

Repeat in:

- **Test mode** (toggle “Test mode” on in Stripe)
- **Live mode** (toggle off)

> Lookup keys must be identical in test and live. Price IDs (`price_xxx`) will differ — that is expected.

### 1.2 Customer portal

1. **Settings** → **Billing** → **Customer portal**
2. Enable subscription management (upgrade/downgrade/cancel)
3. Set return URL: `https://your-domain.com/billing` (or `http://localhost:3000/billing` for local)

### 1.3 Webhooks

#### Production (live)

1. **Developers** → **Webhooks** → **Add endpoint**
2. URL: `https://app.nudgelyapp.com/api/stripe/webhook` (your production URL)
3. Subscribe to events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `subscription_schedule.updated`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the **Signing secret** (`whsec_...`) → Vercel `STRIPE_WEBHOOK_SECRET`

#### Local development (test)

Use the Stripe CLI (do not use the production webhook secret locally):

```powershell
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the `whsec_...` printed by `stripe listen` → `.env` `STRIPE_WEBHOOK_SECRET`.

Keep `stripe listen` running while testing checkout locally.

### 1.4 API keys

| Key | Test | Live |
|-----|------|------|
| Secret | Developers → API keys → **Secret key** (`sk_test_...`) | `sk_live_...` |
| Publishable | **Publishable key** (`pk_test_...`) | `pk_live_...` |

Never commit live keys. Never use live keys on localhost.

---

## Part 2 — Environment variables

### Local development (`.env`)

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Test keys only
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from `stripe listen`, not the dashboard
```

### Production (Vercel → Settings → Environment Variables)

```env
NEXT_PUBLIC_APP_URL=https://app.nudgelyapp.com

STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from live webhook endpoint in dashboard
```

Also required (unchanged): `DATABASE_URL`, `DIRECT_DATABASE_URL`, `BETTER_AUTH_*`, `RESEND_*`, `CRON_SECRET`, etc.

---

## Part 3 — Database

### Recommended: separate DB for local test billing

| Environment | Database | Stripe mode |
|-------------|----------|-------------|
| Local dev | Dev/staging Supabase (or local Postgres) | Test |
| Production | Production Supabase | Live |

Avoid running test checkouts against the production database — test subscriptions write test `price_xxx` values into `company_subscriptions`.

### Sync cached price IDs (optional but useful)

After setting test keys in `.env`:

```bash
npm run stripe:sync-plans
```

Run again with live keys before/after production deploy if you want `plans.stripeMonthlyId` / `stripeYearlyId` to reflect live IDs in the DB.

---

## Part 4 — Verification checklist

### Test mode

```bash
# 1. Validate keys, lookup keys, webhooks
npm run stripe:test:check

# 2. Full smoke test (creates + deletes a test subscription)
npm run stripe:test

# 3. Start app + webhook forwarder
npm run dev
# separate terminal:
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Manual test:

1. Log in as company admin
2. Complete onboarding if required
3. **Subscription** → pick a plan → complete Checkout (`4242 4242 4242 4242`)
4. Confirm **Billing** shows active plan and webhook logs in `stripe listen`
5. Change plan via portal; cancel at period end; confirm emails/DB

### Production

1. Deploy with **live** env vars on Vercel
2. `npm run stripe:sync-plans` locally with `sk_live_...` if you cache IDs (optional)
3. Run `npm run stripe:test:check` with live keys only on a staging machine if needed — or verify in Stripe Dashboard
4. One real low-tier subscription test, then refund/cancel in Stripe if desired

---

## Part 5 — Switching between test and production

You only change **environment variables**, not plan rows in the database:

| Action | Test | Production |
|--------|------|------------|
| Stripe keys | `sk_test_` / `pk_test_` | `sk_live_` / `pk_live_` |
| Webhook secret | From `stripe listen` | From dashboard endpoint |
| App URL | `http://localhost:3000` | `https://app.nudgelyapp.com` |
| Stripe Dashboard | Test mode toggle ON | Test mode toggle OFF |

Optional after switching keys:

```bash
npm run stripe:sync-plans
```

---

## Part 6 — Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Checkout fails immediately | Lookup key missing in Stripe | Create price with correct lookup key in current mode |
| Webhook 400 | Wrong `STRIPE_WEBHOOK_SECRET` | Local: use `stripe listen` secret; prod: use endpoint secret |
| Plan not updated after payment | Webhook missed `customer.subscription.created`, or `stripe listen` not running | Ensure `stripe listen` is running locally; `checkout.session.completed` now syncs the plan. After checkout, `/billing?session_id=...` also syncs on load. Restart dev server after pulling billing fixes. |
| `npm run stripe:test:check` fails on secret key | Using `sk_live_` | Use test keys for that script, or validate live manually |
| Test subscription on prod company | Shared DB + test keys | Use dev DB locally or test with throwaway company |

### Useful commands

```bash
npm run stripe:test:check      # Validate setup (test keys)
npm run stripe:test            # Smoke test subscription
npm run stripe:sync-plans      # Cache price_xxx IDs from lookup keys
stripe trigger customer.subscription.updated
```

---

## Quick reference — env vars

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Server-side Stripe API (`sk_test_` or `sk_live_`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client Checkout (`pk_test_` or `pk_live_`) |
| `STRIPE_WEBHOOK_SECRET` | Verify webhook signatures (`whsec_...`) |
| `NEXT_PUBLIC_APP_URL` | Checkout success/cancel and portal return URLs |

---

## Related code

- `lib/stripe-prices.ts` — lookup key → price ID resolution
- `actions/subscriptions.ts` — checkout and portal
- `app/api/stripe/webhook/route.ts` — subscription lifecycle
- `scripts/stripe-test.ts` — validation script
- `scripts/stripe-sync-plans.ts` — cache price IDs on plans table
