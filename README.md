# Nudgely

B2B SaaS for recurring email task reminders. Companies create scheduled nudges; recipients complete tasks via tokenized public links.

## Stack

- Next.js 16, React 19, TypeScript
- Prisma 7 + PostgreSQL
- better-auth, Stripe, Resend, Supabase

## Local development

### Prerequisites

- Node.js 20+
- PostgreSQL database (or Prisma Accelerate URL)

### Setup

```bash
npm install
cp .env.example .env
npm run db:generate   # generate client (also runs on postinstall)
npm run db:push       # or npm run db:migrate
npm run dev
```

### Prisma 7.8

This project uses **Prisma ORM 7.8** with the `prisma-client` generator (output: `generated/prisma`).

| File | Role |
|------|------|
| `prisma/schema.prisma` | Schema (edit this) |
| `prisma.config.ts` | CLI config — DB URL, migrations, seed |
| `lib/prisma.ts` | App runtime client (Accelerate) |
| `lib/create-prisma-client.ts` | Client factories |
| `generated/prisma/` | Generated client — do not edit |

**Do not edit** `generated/prisma/schema.prisma` — it is a generated copy and will be overwritten on `prisma generate`.

### Database URLs (important)

Nudgely uses **Prisma Accelerate** at runtime (`DATABASE_URL` in `lib/prisma.ts`). The Prisma CLI cannot migrate through Accelerate — you need a **direct** Postgres URL as well:

| Variable | Used for |
|----------|----------|
| `DATABASE_URL` | App runtime (Accelerate URL) |
| `DIRECT_DATABASE_URL` | `db:migrate`, `db:push`, `db:seed` |

On **Supabase**, set `DIRECT_DATABASE_URL` to the **Session pooler** URI (port **5432**), not the Direct host:

```
postgresql://postgres.[ref]:[password]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
```

Supabase → Project Settings → Database → Connection string → **Session mode** → URI

**Why not `db.[ref].supabase.co`?** That direct host is often **IPv6-only**. On Windows and many networks Node.js cannot reach it, causing `P1001` / `ENOTFOUND`. The session pooler uses IPv4 and works reliably.

Do **not** use port 6543 (transaction pooler) for Prisma.

### Supabase + migrations

This project was originally synced with `db push`. Migration history is baselined in `prisma/migrations/0_baseline/`.

**Day-to-day schema changes (recommended on Supabase):**
```bash
npm run db:sync        # alias for db push — fast, no shadow DB needed
```

**If you need proper migration files for production deploy:**
```bash
npx prisma migrate dev --name your_change   # creates a new migration
npm run db:migrate:deploy                   # apply in production (no shadow DB)
```

**If migration history gets out of sync** (existing DB, already has tables):
```bash
npm run db:sync
npm run db:migrate:resolve   # marks 0_baseline as applied — run once only
```

### Useful scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run test` | Run unit tests |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Apply migrations (via `DIRECT_DATABASE_URL`) |
| `npm run db:push` | Push schema (via `DIRECT_DATABASE_URL`) |
| `npm run db:seed` | Seed demo data (via `DIRECT_DATABASE_URL`) |
| `npm run email` | Preview React Email templates |

## Cron jobs (Vercel)

| Schedule | Route | Purpose |
|----------|-------|---------|
| Hourly at :05 | `/api/cron/send-nudges` | Send nudges and reminders |
| Daily 03:00 UTC | `/api/cron/daily-summary` | Admin digest email |
| Daily 04:00 UTC | `/api/cron/check-subscriptions` | Downgrade warning emails |

All cron routes require `Authorization: Bearer $CRON_SECRET`. On Vercel, `x-vercel-cron` is also validated.

Set `CRON_SUMMARY_TIMEZONE` (default `UTC`) for daily summary date boundaries.

## Migrations

Migration history is baselined in `prisma/migrations/0_baseline/`. The database was originally created with `db push`.

For local Supabase development, prefer `npm run db:sync` over `migrate dev` — Supabase does not support Prisma shadow databases, which can cause intermittent `P1001` errors during `migrate dev`.

Use `npm run db:migrate:deploy` in production/CI to apply pending migrations without a shadow DB.

## Environment variables

Key variables:

- `DATABASE_URL` — Prisma Accelerate URL (app runtime)
- `DIRECT_DATABASE_URL` — Direct Postgres URL (migrations, db push, seed)
- `CRON_SECRET` — Cron job authentication
- `STRIPE_*` — Billing
- `RESEND_API_KEY` — Email delivery
- `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_*` — Authentication
