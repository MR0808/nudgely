# Nudgely production runsheet & test plan

**Production URL:** https://app.nudgelyapp.com  
**Last automated check:** run `npm run production:check` before each release  
**Audience:** operator / site admin performing go-live verification

Use this document as a single checklist from “ready to ship” through “confirmed working in production.”

---

## Part 1 — Final audit summary

### Automated pre-flight (run now)

```bash
npm run production:check      # env + DB + Stripe live + health (40 checks)
npm run production:verify -- https://app.nudgelyapp.com
```

**Expected:** all checks pass (warnings only for optional items like Prisma Accelerate).

### Infrastructure status

| Area | Status | Notes |
|------|--------|-------|
| Deploy & health | ✅ | `/api/health` returns `{ "status": "ok" }` |
| Env vars | ✅ | Live Stripe, Resend, auth, cron, Sentry build token |
| Database | ✅ | Migrations via `vercel-build`; 4 plans seeded |
| Stripe live | ✅ | Lookup keys + webhook endpoint configured |
| Auth | ✅ | Rate limits, session revocation, no localhost in prod |
| Billing | ✅ | Webhooks, `past_due` handling, payment-failed email |
| Email | ✅ | Resend sending + bounce/complaint suppression |
| Cron | ✅ | 3 Vercel crons; batching; `CRON_SECRET` auth |
| Security | ✅ | Headers, destructive seed blocked in production |
| Observability | ✅ | Sentry + `/monitoring` tunnel |

### Non-blockers (post-launch tuning)

| Item | Recommendation |
|------|----------------|
| `DATABASE_URL` not Accelerate | OK if using direct Postgres; Accelerate is optional |
| Sentry `tracesSampleRate: 1` | Lower to `0.1` after first week to reduce volume/cost |
| Sentry `sendDefaultPii: true` | Review privacy policy implications |
| Google OAuth | Disabled intentionally |
| Shared test/prod DB | Split databases when feasible |
| `/api/sentry-example-api` | Remove or protect before public marketing push |
| Demo seed companies | Fine for demos; do not use `@demo-*.test` for billing tests |

---

## Part 2 — Go-live runsheet (operator)

Work top to bottom. Check each box before announcing live.

### A. Vercel & environment

- [ ] **A1** Vercel production env has all required variables (see [deployment.md](./deployment.md))
- [ ] **A2** `BETTER_AUTH_URL` = `NEXT_PUBLIC_APP_URL` = `https://app.nudgelyapp.com` (no typo, no trailing slash)
- [ ] **A3** `STRIPE_SECRET_KEY` starts with `sk_live_`
- [ ] **A4** `STRIPE_WEBHOOK_SECRET` is from the **live** Stripe webhook endpoint (not `stripe listen`)
- [ ] **A5** `RESEND_WEBHOOK_SECRET` is from Resend production webhook
- [ ] **A6** `SENTRY_AUTH_TOKEN` set for production builds (source maps)
- [ ] **A7** Latest commit deployed; build succeeded (migrations ran)

```bash
npm run production:check   # must exit 0
```

### B. Third-party dashboards

- [ ] **B1** Stripe (live mode) → Webhooks → `https://app.nudgelyapp.com/api/stripe/webhook` → **Enabled**
- [ ] **B2** Stripe → Customer portal → return URL `https://app.nudgelyapp.com/billing`
- [ ] **B3** Resend → Domains → sending domain **Verified**
- [ ] **B4** Resend → Webhooks → `https://app.nudgelyapp.com/api/resend/webhook` → `email.bounced`, `email.complained`
- [ ] **B5** Supabase → storage bucket accessible (company logos)
- [ ] **B6** Sentry project receiving events (see Test 10)

### C. Deploy smoke test (5 minutes)

- [ ] **C1** Open https://app.nudgelyapp.com — login page loads
- [ ] **C2** `GET https://app.nudgelyapp.com/api/health` → `200` + `"status":"ok"`
- [ ] **C3** No console errors on login page (browser devtools)

### D. Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Operator | | | |
| Product owner | | | |

---

## Part 3 — Production test plan

**How to use:** Run tests in order for first go-live. Mark **Pass / Fail / Skip** and note any ticket IDs.

**Test accounts** (local files — do not commit):

| Account | Purpose |
|---------|---------|
| Site admin (`prisma/seed/.last-seed-credentials.txt`) | Admin panel, cron trigger, cross-company checks |
| Demo companies (`prisma/seed/.last-demo-credentials.txt`) | Product flows on Free / Starter / Growth |
| **New throwaway company** | Live Stripe checkout (use real card, then cancel) |

Use your own inbox for nudge recipient tests.

---

### Test 1 — Authentication

| # | Step | Expected result | Pass |
|---|------|-----------------|------|
| 1.1 | Go to `/auth/login`, sign in as site admin | Redirect to dashboard | ☐ |
| 1.2 | Sign out, sign back in | Session works | ☐ |
| 1.3 | `/auth/forgot-password` with valid email | Reset email received (check spam) | ☐ |
| 1.4 | Complete reset link → set new password → login | Success | ☐ |
| 1.5 | `/auth/register` new user (use `+alias` on your email) | Verification email sent | ☐ |
| 1.6 | Click verify link → complete onboarding | Lands on dashboard | ☐ |
| 1.7 | Rapid forgot-password 6× same email | Rate limit message (no email flood) | ☐ |

**Verify:** Resend dashboard shows sent emails; no 5xx in Vercel logs.

---

### Test 2 — Company & team setup

| # | Step | Expected result | Pass |
|---|------|-----------------|------|
| 2.1 | `/company` — update company name/logo | Saves; logo displays if uploaded | ☐ |
| 2.2 | `/team/create` — create a team | Team appears in sidebar | ☐ |
| 2.3 | Invite team member (use second email you control) | Invite email received | ☐ |
| 2.4 | Open invite link in incognito → accept | User joins team | ☐ |
| 2.5 | `/settings` — update profile | Saves correctly | ☐ |

---

### Test 3 — Nudge creation & scheduling

| # | Step | Expected result | Pass |
|---|------|-----------------|------|
| 3.1 | `/nudges/create` — weekly nudge, due **within next hour** | Nudge created, status Active | ☐ |
| 3.2 | Add yourself as recipient | Recipient saved | ☐ |
| 3.3 | `/nudges/[slug]` — view detail | Schedule and recipients correct | ☐ |
| 3.4 | `/complete/[token]` — open completion link from email (after Test 4) | Marks complete; UI updates | ☐ |
| 3.5 | Edit nudge — change title | Saves; audit log entry (admin) | ☐ |
| 3.6 | Free plan: exceed nudge limit if applicable | Clear upgrade/limit message | ☐ |

---

### Test 4 — Nudge email delivery (cron)

Nudges send on the **hourly cron** (`:05` past each hour UTC) or via admin manual trigger.

| # | Step | Expected result | Pass |
|---|------|-----------------|------|
| 4.1 | **Option A:** Admin → `/admin/cron` → **Run send-nudges** | Toast success; stats update | ☐ |
| 4.2 | **Option B:** Wait for next hourly Vercel cron | Vercel → Cron → `send-nudges` → **200** | ☐ |
| 4.3 | Recipient inbox | Nudge email received from verified domain | ☐ |
| 4.4 | Email links | `complete` link works; app links use `app.nudgelyapp.com` | ☐ |
| 4.5 | Vercel logs | `[cron:send-nudges]` success lines, no 401 | ☐ |

**SQL (optional):**

```sql
SELECT status, COUNT(*) FROM nudge_instances GROUP BY status;
SELECT COUNT(*) FROM nudge_events WHERE "createdAt" > NOW() - INTERVAL '1 hour';
```

---

### Test 5 — Reminders

| # | Step | Expected result | Pass |
|---|------|-----------------|------|
| 5.1 | Create nudge with reminder enabled, due soon | Reminder scheduled | ☐ |
| 5.2 | After cron run past reminder time | Reminder email received | ☐ |

---

### Test 6 — Stripe billing (live)

Use a **dedicated test company** (not a paying customer). Real card required.

| # | Step | Expected result | Pass |
|---|------|-----------------|------|
| 6.1 | Log in as company admin on Free plan → `/billing` | Plans display correct prices | ☐ |
| 6.2 | Select **Starter**, monthly → Checkout | Stripe Checkout opens (live mode) | ☐ |
| 6.3 | Complete payment with real card | Redirect to `/billing?session_id=...` | ☐ |
| 6.4 | Billing page | Plan shows **Starter**, status **active** | ☐ |
| 6.5 | Stripe Dashboard → Webhooks | `checkout.session.completed`, `customer.subscription.created` → **2xx** | ☐ |
| 6.6 | Stripe Dashboard → Customers | Subscription visible | ☐ |
| 6.7 | Billing → **Manage subscription** (portal) | Portal opens; can view invoice | ☐ |
| 6.8 | Upgrade to Growth via portal or app | Plan updates after webhook | ☐ |
| 6.9 | Downgrade to Starter | Scheduled or immediate per Stripe rules | ☐ |
| 6.10 | **Cleanup:** Cancel subscription in Stripe; refund if needed | Company returns to Free or cancelled state | ☐ |

**SQL:**

```sql
SELECT c.name, p.name AS plan, cs.status, cs."stripeSubscriptionId"
FROM companies c
JOIN plans p ON p.id = c."planId"
LEFT JOIN company_subscriptions cs ON cs."companyId" = c.id
WHERE c.slug = 'your-test-company-slug';
```

---

### Test 7 — Failed payment handling (optional, advanced)

Skip unless you want to validate dunning before launch.

| # | Step | Expected result | Pass |
|---|------|-----------------|------|
| 7.1 | Create throwaway sub with [Stripe test card 4000000000000341](https://docs.stripe.com/testing) **only in test mode** — or use Stripe test clock in test env | N/A in live without real failure | ☐ |
| 7.1-alt | In **live**, use a sub you will cancel; simulate via Stripe Dashboard “mark uncollectible” if available | `past_due` banner on dashboard | ☐ |
| 7.2 | Dashboard banner | “Payment failed” message + link to billing | ☐ |
| 7.3 | Email | Payment-failed email to company admin (once per transition) | ☐ |
| 7.4 | Create new nudge while `past_due` | Blocked with clear message | ☐ |

---

### Test 8 — Resend webhooks (bounce suppression)

| # | Step | Expected result | Pass |
|---|------|-----------------|------|
| 8.1 | Resend Dashboard → Webhooks → **Send test event** → `email.bounced` (hard) | Endpoint returns **200** | ☐ |
| 8.2 | Check DB | Row in `email_suppressions` | ☐ |
| 8.3 | Add suppressed address as nudge recipient → run cron | Skipped in logs; no send | ☐ |

```sql
SELECT email, reason, "createdAt" FROM email_suppressions ORDER BY "createdAt" DESC LIMIT 5;
```

---

### Test 9 — Subscription maintenance cron

| # | Step | Expected result | Pass |
|---|------|-----------------|------|
| 9.1 | Vercel → Cron → `check-subscriptions` | **200** after 04:00 UTC run | ☐ |
| 9.2 | Company with scheduled downgrade at period end | Downgrade email when due | ☐ |
| 9.3 | Vercel → Cron → `daily-summary` | **200**; email to `ADMIN_EMAIL` | ☐ |

---

### Test 10 — Observability & errors

| # | Step | Expected result | Pass |
|---|------|-----------------|------|
| 10.1 | Trigger test error: `GET /api/sentry-example-api` | Issue appears in Sentry within ~1 min | ☐ |
| 10.2 | Vercel → Logs | No recurring 5xx on `/api/auth/*` | ☐ |
| 10.3 | Set up uptime monitor on `/api/health` | Alert configured | ☐ |

**Remove** `/api/sentry-example-api` (and any example page) before marketing launch.

---

### Test 11 — Admin panel

Sign in as **site admin**.

| # | Step | Expected result | Pass |
|---|------|-----------------|------|
| 11.1 | `/admin` | Dashboard loads | ☐ |
| 11.2 | `/admin/companies` | Lists companies; can view detail | ☐ |
| 11.3 | `/admin/users` | Lists users; ban disables login | ☐ |
| 11.4 | `/admin/cron` | Manual send-nudges works | ☐ |
| 11.5 | `/admin/audit-logs` | Recent actions visible | ☐ |
| 11.6 | `/admin/plans` | 4 plans; Stripe IDs populated | ☐ |

---

### Test 12 — Data export (plan-gated)

| # | Step | Expected result | Pass |
|---|------|-----------------|------|
| 12.1 | Free company → export | Blocked or limited per plan rules | ☐ |
| 12.2 | Growth+ company → `/api/company/export` or UI export | CSV/JSON downloads | ☐ |
| 12.3 | Audit log | Export action logged | ☐ |

---

### Test 13 — Security spot checks

| # | Step | Expected result | Pass |
|---|------|-----------------|------|
| 13.1 | `GET /api/cron/send-nudges` without auth | **401** | ☐ |
| 13.2 | `GET /api/company/export` without session | **401** | ☐ |
| 13.3 | Log in as company A user; try company B URL | Denied / redirect | ☐ |
| 13.4 | Response headers (browser network tab) | `X-Frame-Options`, `X-Content-Type-Options` present | ☐ |

```bash
curl -sI https://app.nudgelyapp.com | findstr /i "x-frame x-content"
```

---

## Part 4 — Cron schedule reference

Configured in `vercel.json` (all times **UTC**):

| Job | Schedule | Path | Purpose |
|-----|----------|------|---------|
| send-nudges | `5 * * * *` | `/api/cron/send-nudges` | Hourly nudge + reminder sends |
| daily-summary | `0 3 * * *` | `/api/cron/daily-summary` | Admin digest email |
| check-subscriptions | `0 4 * * *` | `/api/cron/check-subscriptions` | Downgrades, warnings |

Optional env: `CRON_SUMMARY_TIMEZONE=Australia/Melbourne` for digest content.

Manual trigger: **Admin → Cron** (does not require HTTP cron auth).

---

## Part 5 — Useful commands

```bash
# Automated checks
npm run production:check
npm run production:verify -- https://app.nudgelyapp.com
npm run stripe:live:check

# After creating new Stripe prices
npm run stripe:bootstrap-prices
npm run stripe:sync-plans

# Never on production unless intentional
npm run db:seed          # DESTRUCTIVE — wipes data
npm run db:seed:demo     # Adds demo companies only
```

---

## Part 6 — Rollback

| Scenario | Action |
|----------|--------|
| Bad deploy | Vercel → Deployments → Promote previous |
| DB migration issue | Fix forward migration; restore Supabase backup if critical |
| Wrong Stripe charge | Refund/cancel in Stripe Dashboard |
| Webhook secret leak | Rotate in Stripe/Resend; update Vercel env; redeploy |

---

## Part 7 — Post-launch (first 48 hours)

- [ ] Monitor Sentry for new error groups
- [ ] Check Vercel Cron logs for 401/500
- [ ] Check Stripe webhook delivery rate (target 100% 2xx)
- [ ] Check Resend delivery + bounce rate
- [ ] Confirm at least one real customer nudge cycle completed
- [ ] Lower Sentry `tracesSampleRate` if volume is high

---

## Related docs

- [deployment.md](./deployment.md) — env vars and deploy process
- [stripe-setup.md](./stripe-setup.md) — Stripe lookup keys and webhooks
- [resend-webhooks.md](./resend-webhooks.md) — bounce suppression
