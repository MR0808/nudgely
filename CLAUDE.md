# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Nudgely is a B2B SaaS for recurring email task reminders. Companies create scheduled "nudges" (recurring email prompts); recipients complete tasks via tokenized public links with no auth required. The app routes are split across authenticated dashboard, admin panel, public completion page, and marketing landing.

## Commands

```bash
npm run dev                  # Start dev server
npm run build                # Production build (auto-generates Prisma client first)
npm run lint                 # ESLint — zero warnings tolerance
npm run test                 # Run Vitest once
npm run test:watch           # Vitest in watch mode
npx vitest lib/nudge-helpers.test.ts  # Run a single test file
npx vitest --grep="pattern"  # Run tests matching a name pattern

# Database
npm run db:push              # Sync schema to DB (preferred on Supabase — no shadow DB needed)
npm run db:migrate           # Apply migrations (uses DIRECT_DATABASE_URL)
npm run db:generate          # Regenerate Prisma client
npm run db:seed              # Wipe and reseed (destructive — blocked in production)
npm run db:seed:demo         # Add demo companies only (non-destructive)

# Stripe
npm run stripe:sync-plans    # Sync Stripe prices to database
npm run stripe:test          # Validate test Stripe setup
npm run production:check     # Full pre-deploy readiness check
```

## Architecture

### Route Groups

- `app/(dashboard)/` — Authenticated SaaS dashboard: company settings, nudges, team, billing, analytics
- `app/admin/` — Site-admin panel (user and company management across all tenants)
- `app/auth/` — Login, signup, password reset
- `app/onboarding/` — Company onboarding flow (runs once after signup)
- `app/complete/` — **Public** task completion page (tokenized URL, no session required)
- `app/front/` — Marketing landing page
- `app/api/` — API routes for auth, cron, Stripe webhooks, Resend webhooks

### Data Flow

Business logic lives in **Server Actions** (`actions/`), not API routes. API routes are used only for webhooks and cron triggers. The pattern is: React form → Server Action (Zod validation + Prisma) → revalidatePath.

### Key Lib Modules

- `lib/prisma.ts` — Prisma Accelerate client (for runtime queries)
- `lib/auth.ts` — better-auth instance with session helpers
- `lib/permissions.ts` — Role/permission checks (SITE_ADMIN, company OWNER/ADMIN/MEMBER)
- `lib/email.ts` — Resend client wrapper
- `lib/nudge-helpers.ts` — Nudge scheduling logic (frequency, end-date, occurrence calculations)
- `lib/cron/` — Cron handlers: `send-nudges.ts`, `daily-summary.ts`, subscription expiry checks

### Database (Prisma + PostgreSQL)

Two connection URLs are required:
- `DATABASE_URL` — Prisma Accelerate URL (`prisma+postgres://...`) — used at runtime
- `DIRECT_DATABASE_URL` — Direct Postgres (session pooler on port 5432, not direct host) — used for CLI migrations and seeding

Prefer `npm run db:push` over `db:migrate` on Supabase (no shadow database required).

### Auth

better-auth handles sessions. The `BETTER_AUTH_SECRET` must be set. Google OAuth fields exist in the schema but social sign-in is currently disabled. Public routes (like `/complete`) bypass auth entirely via tokenized URLs stored in `NudgeInstance`.

### Billing

Stripe plans are resolved by **lookup keys** (e.g., `nudgely_starter_monthly`), not hardcoded price IDs. This means test and live environments use the same code — just swap the Stripe keys. Plans are synced to the `Plan` table via `npm run stripe:sync-plans`.

### Email

Transactional emails use Resend + React Email templates in `emails/`. Preview templates with `npm run email`. Cron jobs trigger bulk nudge sends; the send-nudges cron is called hourly and requires `CRON_SECRET` in the Authorization header.

### Cron Jobs

Defined in `vercel.json`, hitting `/api/cron/*` endpoints. All require `Authorization: Bearer $CRON_SECRET`. Key tuning env vars: `CRON_BUDGET_MS`, `CRON_NUDGE_BATCH_SIZE`, `CRON_RECIPIENT_CONCURRENCY`.

## Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4, Radix UI, Shadcn/ui, Framer Motion
- **Forms**: react-hook-form + Zod
- **ORM**: Prisma 7 with PostgreSQL
- **Auth**: better-auth
- **Billing**: Stripe
- **Email**: Resend + React Email
- **Storage**: Supabase S3 (company logos)
- **Monitoring**: Sentry (errors), Umami (analytics)
- **Tests**: Vitest (node environment, `*.test.ts` files only)

## Linting

ESLint is configured with zero warnings tolerance (`--max-warnings 0`). The `eslint.config.mjs` ignores `generated/` and `emails/` directories. `@typescript-eslint/no-unused-vars` and `react-hooks/exhaustive-deps` are set to warn rather than error.
