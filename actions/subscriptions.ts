'use server';

import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';
import {
    Plan,
    PendingCompanySubscription,
    Company,
    CompanySubscription
} from '@/generated/prisma';

type ActionResult<T> =
    | { success: true; message: string; data: T }
    | {
          success: false;
          message: string;
          data?: undefined;
          cooldownTime?: number;
      };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover'
});

/* ────────────────────────────────────────────────────────────────────────────
   Create Checkout Session
──────────────────────────────────────────────────────────────────────────── */

export async function createCheckoutSessions(
    priceId: string,
    companyId: string
): Promise<ActionResult<{ sessionId: string; url: string | null }>> {
    const session = await authCheckServer();
    if (!session) {
        return { success: false, message: 'Not authorised' };
    }

    try {
        const company = await prisma.company.findUnique({
            where: { id: companyId }
        });

        if (!company) {
            return { success: false, message: 'Company not found' };
        }

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
            metadata: { userId: session.user.id },
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
    const session = await authCheckServer();
    if (!session) {
        return { success: false, message: 'Not authorised' };
    }

    const { company, userCompany } = session;

    if (userCompany.role !== 'COMPANY_ADMIN') {
        return { success: false, message: 'Not authorised' };
    }

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

        const plan = await prisma.plan.findFirst({
            where: {
                OR: [
                    { stripeMonthlyId: pending.priceId },
                    { stripeYearlyId: pending.priceId }
                ]
            }
        });

        if (!plan) {
            return { success: false, message: 'No plan found' };
        }

        const isYearly = plan.stripeYearlyId === pending.priceId;

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
        payment: {
            address: Stripe.Address | null;
            card: Stripe.PaymentMethod.Card | null | undefined;
        } | null;
        invoices: Stripe.ApiList<Stripe.Invoice> | null;
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

    const session = await authCheckServer();
    if (!session || session.userCompany.role !== 'COMPANY_ADMIN') {
        return {
            success: false,
            message: 'Not authorised',
            data: undefined
        };
    }

    try {
        const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);

        const paymentMethodId =
            typeof subscription.default_payment_method === 'string'
                ? subscription.default_payment_method
                : subscription.default_payment_method?.id || '';

        const paymentMethod =
            await stripe.paymentMethods.retrieve(paymentMethodId);

        const invoices = await stripe.invoices.list({
            customer: customerId
        });

        return {
            success: true,
            message: 'Payment information loaded',
            data: {
                payment: {
                    address: paymentMethod.billing_details.address,
                    card: paymentMethod.card
                },
                invoices,
                nextBillingDate:
                    subscription.items.data[0].current_period_end ?? null
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
    const session = await authCheckServer();
    if (!session) return { success: false, message: 'Not authorised' };

    if (!customerId) {
        return { success: false, message: 'Customer ID is required' };
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

        const portalSession =
            await stripe.billingPortal.sessions.create(params);

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

        // Disable extra users
        if (maxUsers !== 0 && company.members.length > maxUsers) {
            await prisma.user.updateMany({
                where: { companyMember: { some: { companyId } } },
                data: { status: 'DISABLED' }
            });
        }

        // Disable extra teams
        if (maxTeams !== 0 && company.teams.length > maxTeams) {
            await prisma.team.updateMany({
                where: { companyId },
                data: { status: 'DISABLED' }
            });
        }

        // Disable teams' nudges
        for (const team of company.teams) {
            if (maxTeams !== 0 && company.teams.length > maxTeams) {
                await prisma.nudge.updateMany({
                    where: { teamId: team.id },
                    data: { status: 'DISABLED' }
                });
            }
        }

        // Count nudges
        const totalNudges = company.teams.reduce(
            (acc, team) => acc + team.nudges.length,
            0
        );

        if (maxNudges !== 0 && totalNudges > maxNudges) {
            await prisma.nudge.updateMany({
                where: { team: { companyId } },
                data: { status: 'DISABLED' }
            });
        }

        // Check recipients
        const nudges = await prisma.nudge.findMany({
            where: { team: { companyId } },
            include: { recipients: true }
        });

        for (const nudge of nudges) {
            if (
                maxRecipients !== 0 &&
                nudge.recipients.length > maxRecipients
            ) {
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
