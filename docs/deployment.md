# Nudgely deployment runbook

Production go-live checklist for Vercel + Supabase + Stripe + Resend.

---

## 1. Environment variables (Vercel)

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Prisma Accelerate URL (runtime) |
| `DIRECT_DATABASE_URL` | Yes | Direct Postgres — **required at build** for `prisma migrate deploy` |
| `BETTER_AUTH_SECRET` | Yes | Random 32+ char string |
| `BETTER_AUTH_URL` | Yes | `https://app.nudgelyapp.com` |
| `NEXT_PUBLIC_APP_URL` | Yes | Same as production URL |
| `CRON_SECRET` | Yes | Random string; Vercel sends as `Authorization: Bearer` |
| `STRIPE_SECRET_KEY` | Yes | `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Yes | From live Stripe webhook endpoint |
| `RESEND_API_KEY` | Yes | |
| `RESEND_WEBHOOK_SECRET` | Yes | From Resend webhook |
| `NEXT_PUBLIC_APP_EMAIL` | Yes | Verified sending address |
| `NEXT_PUBLIC_APP_EMAIL_SUPPORT` | Yes | Support reply-to |
| `ADMIN_EMAIL` | Recommended | Daily admin digest recipient |
| `SUPABASE_URL` | Yes | Or `NEXT_PUBLIC_SUPABASE_URL` |
| `SUPABASE_KEY` | Yes | Service role — or `SUPABASE_SERVICE_ROLE_KEY` |

Optional cron tuning: `CRON_BUDGET_MS`, `CRON_NUDGE_BATCH_SIZE`, `CRON_REMINDER_BATCH_SIZE`, `CRON_RECIPIENT_CONCURRENCY`.

---

## 2. Database

### First deploy (empty database)

```bash
# Migrations run automatically via vercel-build
# Then seed reference data only (non-destructive):
npm run db:seed:reference
```

### Ongoing deploys

`vercel-build` runs `prisma migrate deploy` automatically.

**Never** run `npm run db:seed` against production unless you intend to wipe all data.

---

## 3. Stripe (live)

See [stripe-setup.md](./stripe-setup.md).

```bash
npm run stripe:live:check
```

Manual: one real Starter checkout → confirm webhooks 2xx → cancel/refund in Stripe Dashboard.

---

## 4. Resend

See [resend-webhooks.md](./resend-webhooks.md).

1. Verify sending domain
2. Webhook → `https://your-domain/api/resend/webhook`
3. Events: `email.bounced`, `email.complained`

---

## 5. Post-deploy verification

See **[production-runsheet.md](./production-runsheet.md)** for the full go-live checklist and production test plan.

Run locally (with production env vars in `.env`):

```bash
npm run production:check    # Full pre-go-live: env, DB, Stripe live, health
npm run production:verify   # Quick post-deploy: GET /api/health only
npm run stripe:live:check   # Stripe-only subset
```

| Check | Command / action |
|-------|------------------|
| Health | `npm run production:verify -- https://app.nudgelyapp.com` |
| Full readiness | `npm run production:check` |
| Crons | Vercel → Cron Jobs → confirm 200 responses (not 401) |
| Nudges | Create test nudge; wait for hourly cron or trigger from Admin → Cron |
| Billing | Upgrade test company; confirm webhook + billing page |
| Bounces | Resend dashboard → send test bounce webhook |
| Sentry | Visit `/sentry-example-page` once, confirm issue in Sentry dashboard |

Set up external uptime monitoring on `/api/health`.

### Sentry on Vercel

| Variable | Required |
|----------|----------|
| `SENTRY_AUTH_TOKEN` | Yes (for readable stack traces via source maps) |

Runtime error reporting uses the DSN in `sentry.*.config.ts` — no extra DSN env vars needed.

---

## 6. Related docs

- [production-runsheet.md](./production-runsheet.md) — **go-live checklist & production test plan**
- [stripe-setup.md](./stripe-setup.md) — lookup keys, webhooks, live checklist
- [resend-webhooks.md](./resend-webhooks.md) — bounce suppression
- [README.md](../README.md) — local development

---

## 7. Rollback

- Vercel: redeploy previous deployment from dashboard
- Database: migrations are forward-only; restore from Supabase backup if needed
- Stripe: cancel/refund subscriptions manually in dashboard
