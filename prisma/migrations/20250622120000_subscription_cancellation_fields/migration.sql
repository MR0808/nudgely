-- AlterTable
ALTER TABLE "company_subscriptions" ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "company_subscriptions" ADD COLUMN "canceledAt" TIMESTAMP(3);
