'use server';

import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { authCheckServerWithCompany } from '@/lib/authCheck';
import {
    findPlanByStripePriceId,
    isYearlyStripePriceId,
    resolvePlanStripePriceId
} from '@/lib/stripe-prices';
import { syncCheckoutSessionToCompany } from '@/lib/sync-company-subscription';
import {
    serializeStripeInvoices,
    serializeStripePayment,
    type BillingInvoicesList,
    type BillingPayment
} from '@/lib/stripe-billing-display';
import type Stripe from 'stripe';

type ActionResult<T> =
    | { success: true; message: string; data: T }
    | {
          success: false;
          message: string;
          data?: undefined;
          cooldownTime?: number;
      };

type CompanySession = Exclude<
    Awaited<ReturnType<typeof authCheckServerWithCompany>>,
    false
>;

function isCompanyAdmin(session: CompanySession) {
    return session.userCompany.role === 'COMPANY_ADMIN';
}

function ownsStripeCustomer(session: CompanySession, customerId: string) {
    return session.company.stripeCustomerId === customerId;
}

/* ────────────────────────────────────────────────────────────────────────────
   Create Checkout Session
──────────────────────────────────────────────────────────────────────────── */

export async function createCheckoutSessions(
    planId: string,
    billingInterval: 'MONTHLY' | 'YEARLY',
    companyId: string
): Promise<ActionResult<{ sessionId: string; url: string | null }>> {
    const session = await authCheckServerWithCompany();
    if (!session) {
        return { success: false, message: 'Not authorised' };
    }

    if (!isCompanyAdmin(session)) {
        return { success: false, message: 'Not authorised' };
    }

    if (session.company.id !== companyId) {
        return { success: false, message: 'Not authorised' };
    }

    try {
        const company = await prisma.company.findUnique({
            where: { id: companyId }
        });

        if (!company) {
            return { success: false, message: 'Company not found' };
        }

        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) {
            return { success: false, message: 'Plan not found' };
        }

        const priceId = await resolvePlanStripePriceId(plan, billingInterval);

        const subscriptionMetadata = {
            userId: session.user.id,
            companyId
        };

        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1
                }
            ],
            billing_address_collection: 'required',
            client_reference_id: companyId,
            customer: company.stripeCustomerId || undefined,
            customer_email: company.stripeCustomerId
                ? undefined
                : session.user.email,
            metadata: subscriptionMetadata,
            subscription_data: {
                metadata: subscriptionMetadata
            },
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`
        });

        return {
            success: true,
            message: 'Checkout session created',
            data: {
                sessionId: stripeSession.id,
                url: stripeSession.url
            }
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to create checkout session - ${error}`
        };
    }
}

/* ────────────────────────────────────────────────────────────────────────────
   Sync billing after Stripe Checkout redirect (webhook fallback)
──────────────────────────────────────────────────────────────────────────── */

export async function syncBillingCheckoutSession(
    checkoutSessionId: string
): Promise<ActionResult<{ planName: string }>> {
    const session = await authCheckServerWithCompany();
    if (!session || !isCompanyAdmin(session)) {
        return { success: false, message: 'Not authorised' };
    }

    try {
        const result = await syncCheckoutSessionToCompany(checkoutSessionId, {
            companyIdHint: session.company.id,
            sendWelcomeEmail: false,
            writeAuditLog: false
        });

        if (!result) {
            return { success: false, message: 'Checkout session has no subscription' };
        }

        if (result.company.id !== session.company.id) {
            return { success: false, message: 'Not authorised' };
        }

        return {
            success: true,
            message: 'Subscription synced',
            data: { planName: result.plan.name }
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to sync subscription - ${error}`
        };
    }
}

/* ────────────────────────────────────────────────────────────────────────────
   Get Pending Subscriptions
──────────────────────────────────────────────────────────────────────────── */

export async function getPendingSubscriptions(): Promise<
    ActionResult<{
        planName: string;
        planPrice: number;
        planInterval: 'MONTHLY' | 'YEARLY';
        planColour: string;
        planIcon: string;
        planIconClassName: string | null;
        activeDate: Date;
    }>
> {
    const session = await authCheckServerWithCompany();
    if (!session) {
        return { success: false, message: 'Not authorised' };
    }

    if (!isCompanyAdmin(session)) {
        return { success: false, message: 'Not authorised' };
    }

    const { company } = session;

    try {
        const pending = await prisma.pendingCompanySubscription.findFirst({
            where: { company: { id: company.id } }
        });

        if (!pending) {
            return {
                success: false,
                message: 'No pending subscription'
            };
        }

        const plan = await findPlanByStripePriceId(pending.priceId);

        if (!plan) {
            return { success: false, message: 'No plan found' };
        }

        const isYearly = await isYearlyStripePriceId(pending.priceId);

        return {
            success: true,
            message: 'Pending subscription found',
            data: {
                planName: plan.name,
                planPrice: isYearly ? plan.priceYearly : plan.priceMonthly,
                planInterval: isYearly ? 'YEARLY' : 'MONTHLY',
                planColour: plan.colour,
                planIcon: plan.icon,
                planIconClassName: plan.iconClassname,
                activeDate: pending.activeDate
            }
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to load pending subscription - ${error}`
        };
    }
}

/* ────────────────────────────────────────────────────────────────────────────
   Get Payment Information (cards, invoices)
──────────────────────────────────────────────────────────────────────────── */

export async function getCustomerPaymentInformation(
    customerId: string | null,
    subscriptionId?: string
): Promise<
    ActionResult<{
        payment: BillingPayment | null;
        invoices: BillingInvoicesList | null;
        nextBillingDate: number | null;
    }>
> {
    if (!customerId || !subscriptionId) {
        return {
            success: false,
            message: 'Not applicable',
            data: undefined
        };
    }

    const session = await authCheckServerWithCompany();
    if (!session || !isCompanyAdmin(session)) {
        return {
            success: false,
            message: 'Not authorised',
            data: undefined
        };
    }

    if (!ownsStripeCustomer(session, customerId)) {
        return {
            success: false,
            message: 'Not authorised',
            data: undefined
        };
    }

    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        const paymentMethodId =
            typeof subscription.default_payment_method === 'string'
                ? subscription.default_payment_method
                : subscription.default_payment_method?.id || '';

        let payment: {
            address: Stripe.Address | null;
            card: Stripe.PaymentMethod.Card | null | undefined;
        } | null = null;

        if (paymentMethodId) {
            const paymentMethod =
                await stripe.paymentMethods.retrieve(paymentMethodId);
            payment = {
                address: paymentMethod.billing_details.address,
                card: paymentMethod.card
            };
        }

        const invoices = await stripe.invoices.list({
            customer: customerId,
            limit: 24
        });

        return {
            success: true,
            message: 'Payment information loaded',
            data: {
                payment: serializeStripePayment(payment),
                invoices: serializeStripeInvoices(invoices),
                nextBillingDate:
                    subscription.items.data[0]?.current_period_end ?? null
            }
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to load payment information - ${error}`,
            data: undefined
        };
    }
}

/* ────────────────────────────────────────────────────────────────────────────
   Stripe Billing Portal
──────────────────────────────────────────────────────────────────────────── */

export async function createPortalSession(
    customerId: string,
    subscriptionId?: string
): Promise<ActionResult<{ url: string }>> {
    const session = await authCheckServerWithCompany();
    if (!session) return { success: false, message: 'Not authorised' };

    if (!isCompanyAdmin(session)) {
        return { success: false, message: 'Not authorised' };
    }

    if (!customerId || !ownsStripeCustomer(session, customerId)) {
        return { success: false, message: 'Not authorised' };
    }

    try {
        let params: Stripe.BillingPortal.SessionCreateParams = {
            customer: customerId,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`
        };

        if (subscriptionId) {
            params = {
                ...params,
                flow_data: {
                    type: 'subscription_update',
                    subscription_update: { subscription: subscriptionId }
                }
            };
        }

        const portalSession = await stripe.billingPortal.sessions.create(params);

        return {
            success: true,
            message: 'Portal session created',
            data: { url: portalSession.url }
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to create portal session - ${error}`
        };
    }
}

/* ────────────────────────────────────────────────────────────────────────────
   Validate Downgraded Plan — disable excess users/teams/nudges
──────────────────────────────────────────────────────────────────────────── */

export async function checkDowngradedPlan(
    companyId: string
): Promise<ActionResult<true>> {
    try {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            include: {
                plan: true,
                members: true,
                teams: { include: { nudges: true } }
            }
        });

        if (!company) {
            return { success: false, message: 'Company not found' };
        }

        const { maxNudges, maxTeams, maxUsers, maxRecipients } = company.plan;

        if (maxUsers !== 0 && company.members.length > maxUsers) {
            const admins = company.members.filter(
                (member) => member.role === 'COMPANY_ADMIN'
            );
            const others = company.members
                .filter((member) => member.role !== 'COMPANY_ADMIN')
                .sort(
                    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
                );

            const allowedOthers = Math.max(0, maxUsers - admins.length);
            const activeUserIds = new Set([
                ...admins.map((member) => member.userId),
                ...others.slice(0, allowedOthers).map((member) => member.userId)
            ]);

            const disableUserIds = company.members
                .filter((member) => !activeUserIds.has(member.userId))
                .map((member) => member.userId);

            if (disableUserIds.length > 0) {
                await prisma.user.updateMany({
                    where: { id: { in: disableUserIds } },
                    data: { status: 'DISABLED' }
                });
            }
        }

        if (maxTeams !== 0 && company.teams.length > maxTeams) {
            const defaultTeam = company.teams.find((team) => team.defaultTeam);
            const otherTeams = company.teams
                .filter((team) => !team.defaultTeam)
                .sort(
                    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
                );

            const keepTeamIds = new Set<string>();
            if (defaultTeam) keepTeamIds.add(defaultTeam.id);

            for (const team of otherTeams) {
                if (keepTeamIds.size >= maxTeams) break;
                keepTeamIds.add(team.id);
            }

            const disableTeamIds = company.teams
                .filter((team) => !keepTeamIds.has(team.id))
                .map((team) => team.id);

            if (disableTeamIds.length > 0) {
                await prisma.team.updateMany({
                    where: { id: { in: disableTeamIds } },
                    data: { status: 'DISABLED' }
                });
            }
        }

        const allNudges = company.teams.flatMap((team) =>
            team.nudges.map((nudge) => ({
                ...nudge,
                teamId: team.id
            }))
        );

        if (maxNudges !== 0 && allNudges.length > maxNudges) {
            const keepNudgeIds = new Set(
                [...allNudges]
                    .sort(
                        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
                    )
                    .slice(0, maxNudges)
                    .map((nudge) => nudge.id)
            );

            const disableNudgeIds = allNudges
                .filter((nudge) => !keepNudgeIds.has(nudge.id))
                .map((nudge) => nudge.id);

            if (disableNudgeIds.length > 0) {
                await prisma.nudge.updateMany({
                    where: { id: { in: disableNudgeIds } },
                    data: { status: 'DISABLED' }
                });
            }
        }

        const nudges = await prisma.nudge.findMany({
            where: { team: { companyId } },
            include: { recipients: true }
        });

        for (const nudge of nudges) {
            if (maxRecipients !== 0 && nudge.recipients.length > maxRecipients) {
                await prisma.nudge.update({
                    where: { id: nudge.id },
                    data: { status: 'DISABLED' }
                });
            }
        }

        return { success: true, message: 'Plan checks completed', data: true };
    } catch (error) {
        return {
            success: false,
            message: `Failed to process plan downgrade - ${error}`
        };
    }
}
