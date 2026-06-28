# Sentry setup (Nudgely)

Error monitoring for the Next.js app on Vercel. Runtime reporting uses a **hardcoded DSN** in `sentry.server.config.ts`, `sentry.edge.config.ts`, and `instrumentation-client.ts`. Source maps at build time need one env var.

---

## 1. Vercel environment variable

| Variable | Where | Required |
|----------|-------|----------|
| `SENTRY_AUTH_TOKEN` | Vercel → Project → Settings → Environment Variables → **Production** (and Preview if you want maps on preview deploys) | Yes, for readable stack traces |

Create the token:

1. [Sentry](https://sentry.io) → **Settings** → **Auth Tokens** → **Create New Token**
2. Scopes: `project:releases`, `org:read` (or use the “Organization Token” wizard for uploads)
3. Copy token → Vercel `SENTRY_AUTH_TOKEN`
4. Redeploy so the next build uploads source maps

Local builds can use `.env.sentry-build-plugin` (gitignored) with the same variable.

**You do not need** `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN` in Vercel — the DSN is already in the config files.

---

## 2. What is already configured

| Piece | Location |
|-------|----------|
| Server SDK | `sentry.server.config.ts` |
| Edge SDK | `sentry.edge.config.ts` |
| Browser SDK | `instrumentation-client.ts` |
| Next.js wrapper | `next.config.ts` → `withSentryConfig` |
| Ad-blocker tunnel | `/monitoring` |
| Org / project | `nudgely-k5` / `javascript-nextjs` |
| Global error UI | `app/global-error.tsx` (reports to Sentry) |

Current production tuning (already applied):

- `tracesSampleRate: 0.1` — 10% of performance traces
- Session Replay: 10% of sessions, 100% when an error occurs

---

## 3. Verify Sentry is working

### Verify it works

**Important:** `throw new Error(...)` typed directly in the browser DevTools console is **not** sent to Sentry. Chrome runs that outside the page’s error handlers.

#### Server test (recommended)

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://app.nudgelyapp.com/api/sentry-test
```

Check Sentry → **Issues** within ~1 minute for `Nudgely Sentry server test`.

#### Client test

On any app page, run in DevTools **Console**:

```js
setTimeout(() => { throw new Error('Nudgely Sentry client test'); }, 0);
```

(`setTimeout` runs in the page context so Sentry’s global handler can catch it.)

#### Network check

DevTools → **Network** → filter `monitoring` — after a client error you should see POSTs to `/monitoring` with status **200**.

### Source maps

1. Open an issue in Sentry
2. Stack trace should show **original TypeScript file names and line numbers**, not minified `chunk-xxx.js`
3. If you only see minified code → `SENTRY_AUTH_TOKEN` missing or build did not upload maps (check Vercel build logs for Sentry plugin output)

---

## 4. Dashboard URLs

- **Issues:** https://nudgely-k5.sentry.io/issues/
- **Performance:** https://nudgely-k5.sentry.io/performance/
- **Replays:** https://nudgely-k5.sentry.io/replays/

---

## 5. Alerts (recommended)

1. Sentry → **Alerts** → **Create Alert**
2. **Issues** → “A new issue is created” → notify email or Slack
3. Optional: spike alert if error rate jumps

---

## 6. Optional tuning later

In `sentry.server.config.ts` and `instrumentation-client.ts`:

| Option | Current | Suggestion |
|--------|---------|------------|
| `tracesSampleRate` | `0.1` | Keep at 0.1 unless you need more APM data |
| `sendDefaultPii` | `true` | Set `false` if you want less user data in Sentry |
| `replaysSessionSampleRate` | `0.1` | Lower to `0.05` if replay volume is high |

---

## 7. Cleanup before marketing

- Do **not** ship public “throw error” test pages
- `app/api/sentry-example-api` should stay deleted
- Errors from real users and `global-error.tsx` are enough

---

## Related

- [deployment.md](./deployment.md) — full env list
- [production-runsheet.md](./production-runsheet.md) — Test 10 (observability)
