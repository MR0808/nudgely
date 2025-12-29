# HyreLog API (Phase 0)

HyreLog is a developer-first immutable audit log API. **Phase 0** sets up the foundations only:

- **API**: internal endpoints only (`/internal/*`) — no customer business endpoints yet
- **Worker**: placeholder jobs only (archival, GDPR, webhooks)
- **Data**: Prisma schema for multi-region storage + archival + GDPR workflows
- **Infra**: AWS CDK scaffold for deploying **one region at a time**

Supported logical regions from day one:

- **US** → `us-east-1` (default)
- **EU** → `eu-west-1`
- **UK** → `eu-west-2`
- **AU** → `ap-southeast-2`

## Local dev (beginner-friendly)

### 1) Install prerequisites

- Install **Node.js 20+**
- Install **Docker Desktop**

Verify:

```bash
node -v
docker -v
docker compose version
```

### 2) Start local infrastructure (4 Postgres DBs + MinIO)

From repo root:

```bash
docker compose up -d
docker ps
```

You should see:

- `hyrelog-postgres-us` on `localhost:54321`
- `hyrelog-postgres-eu` on `localhost:54322`
- `hyrelog-postgres-uk` on `localhost:54323`
- `hyrelog-postgres-au` on `localhost:54324`
- `hyrelog-minio` on `localhost:9000` (S3 API) and `localhost:9001` (Console UI)

### 3) Create your `.env`

Copy the example env file:

- Copy `.env.example` → `.env`

Then open `.env` and set values. At minimum, you need:

- `INTERNAL_TOKEN` (any random string)
- `DATABASE_URL_US`, `DATABASE_URL_EU`, `DATABASE_URL_UK`, `DATABASE_URL_AU`

Typical local values (match `docker-compose.yml` ports):

- `DATABASE_URL_US=postgresql://hyrelog:hyrelog@localhost:54321/hyrelog_us?schema=public`
- `DATABASE_URL_EU=postgresql://hyrelog:hyrelog@localhost:54322/hyrelog_eu?schema=public`
- `DATABASE_URL_UK=postgresql://hyrelog:hyrelog@localhost:54323/hyrelog_uk?schema=public`
- `DATABASE_URL_AU=postgresql://hyrelog:hyrelog@localhost:54324/hyrelog_au?schema=public`

MinIO (S3-compatible) defaults:

- **Console**: `http://localhost:9001`
- **Username**: `minioadmin`
- **Password**: `minioadmin`

Optional: create buckets in MinIO Console:

- `hyrelog-archive-us`
- `hyrelog-archive-eu`
- `hyrelog-archive-uk`
- `hyrelog-archive-au`

### 4) Install dependencies (npm workspaces)

From repo root:

```bash
npm install
```

### 5) Create DB schema in ALL 4 region databases

This repo stores data per-region. For local dev we emulate that with 4 Postgres DBs.

Run the helper to create the first migration (if needed) and apply it to all regions:

```bash
npm --workspace services/api run prisma:migrate:all
```

### 6) Start the API

```bash
npm run dev
```

### 7) Call internal health endpoint

The API only exposes internal endpoints in Phase 0. They require an internal token header.

PowerShell:

```powershell
$token = "YOUR_INTERNAL_TOKEN_FROM_.env"
Invoke-RestMethod -Headers @{ "x-internal-token" = $token } http://localhost:3000/internal/health
```

curl (Git Bash / WSL):

```bash
curl -H "x-internal-token: YOUR_INTERNAL_TOKEN_FROM_.env" http://localhost:3000/internal/health
```

## Deploy later (AWS CDK scaffold)

CDK is scaffolded under `infra/`. **Phase 0** is intentionally minimal and deploys **one region per command**.

### Example: deploy US

```bash
cd infra
npm install
npx cdk bootstrap --context region=US
npx cdk deploy --context region=US
```

### Other regions

Use `EU`, `UK`, or `AU`:

```bash
npx cdk deploy --context region=EU
```

Notes:

- The stack creates VPC, ECS cluster, ECR repos, RDS Postgres (encrypted, backups enabled), an S3 archive bucket with lifecycle to Glacier/Deep Archive, and CloudWatch log groups.
- Services are created with **desired count = 0** in Phase 0 so the deploy doesn’t require container images yet.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
