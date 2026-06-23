# Resend webhooks (bounces & complaints)

Nudgely suppresses recipient addresses that **hard bounce** or **mark mail as spam**, so the send-nudges cron stops emailing them.

---

## Setup

1. Resend Dashboard → **Webhooks** → **Add webhook**
2. URL: `https://app.nudgelyapp.com/api/resend/webhook` (your production URL)
3. Subscribe to events:
   - `email.bounced`
   - `email.complained` (optional but recommended)
4. Copy the **Signing secret** (`whsec_...`) → Vercel `RESEND_WEBHOOK_SECRET`

Local testing with Resend webhooks usually requires a tunnel (ngrok, Cloudflare Tunnel, etc.) pointing at `http://localhost:3000/api/resend/webhook`.

### Environment variable

```env
RESEND_WEBHOOK_SECRET=whsec_...
```

---

## Behaviour

| Event | Action |
|-------|--------|
| `email.bounced` (hard) | Add address to `email_suppressions`; skip in cron |
| `email.bounced` (soft) | Logged only — Resend may retry |
| `email.complained` | Suppress address (spam complaint) |

Suppressed emails are stored in `email_suppressions` and checked before nudge/reminder sends.

---

## Verification

1. Deploy with `RESEND_WEBHOOK_SECRET` set
2. Resend Dashboard → Webhooks → send a test `email.bounced` event
3. Confirm endpoint returns `200` and row appears in `email_suppressions`

```sql
SELECT email, reason, "createdAt" FROM email_suppressions ORDER BY "createdAt" DESC LIMIT 10;
```

---

## Related code

- `app/api/resend/webhook/route.ts` — webhook handler
- `lib/email-suppression.ts` — suppression helpers
- `lib/cron/send-nudges-job.ts` — skips suppressed recipients
