'use server';
import Stripe from 'stripe';
import { stringify } from 'csv-stringify/sync';

// import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { authCheckServer } from '@/lib/authCheck';
import { error } from 'console';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-09-30.clover'
});

export const createCheckoutSessions = async (
    planId: string,
    companyId: string
) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            error: 'Not authorised'
        };
    }
    try {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            include: { companySubscription: true }
        });
        if (!company) return { error: 'Company not found' };

        // if (method === 'create') {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: planId,
                    quantity: 1
                }
            ],
            billing_address_collection: 'required',
            client_reference_id: companyId,
            customer: company.stripeCustomerId || undefined,
            metadata: { userId: userSession.user.id },
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`
        });

        console.log(session);

        return { sessionId: session.id, url: session.url };
        // }

        // if (!company.companySubscription?.stripeSubscriptionId) {
        //     return { error: 'Company subscription not found' };
        // }
    } catch (error) {
        console.log(error);
        return { error };
    }
};

export const getPendingSubscriptions = async () => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            data: null,
            message: 'Not authorised'
        };
    }

    const { user, company, userCompany } = userSession;

    if (userCompany.role !== 'COMPANY_ADMIN') {
        return {
            data: null,
            message: 'Not authorised'
        };
    }
    try {
        const pendingCompanySubscription =
            await prisma.pendingCompanySubscription.findFirst({
                where: { company: { id: company.id } }
            });

        if (!pendingCompanySubscription) {
            return { data: null, message: 'No pending subscription' };
        }

        const plan = await prisma.plan.findFirst({
            where: {
                OR: [
                    { stripeMonthlyId: pendingCompanySubscription.priceId },
                    { stripeYearlyId: pendingCompanySubscription.priceId }
                ]
            }
        });

        if (!plan) {
            return { data: null, message: 'No plan found' };
        }

        const planPrice =
            plan.stripeYearlyId === pendingCompanySubscription.priceId
                ? plan.priceYearly
                : plan.priceMonthly;

        const planInterval =
            plan.stripeYearlyId === pendingCompanySubscription.priceId
                ? 'YEARLY'
                : 'MONTHLY';

        return {
            data: {
                planName: plan.name,
                planPrice,
                planInterval,
                planColour: plan.colour,
                planIcon: plan.icon,
                planIconClassName: plan.iconClassname,
                activeDate: pendingCompanySubscription.activeDate
            },
            message: ''
        };
    } catch (error) {
        return {
            message: `There was an error - ${error}`,
            data: null
        };
    }
};

export const getCustomerPaymentInformation = async (
    customerId: string | null,
    subscriptionId?: string
) => {
    if (!subscriptionId || !customerId)
        return {
            error: 'Not applicable',
            payment: null,
            invoices: null,
            nextBillingDate: null
        };

    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            error: 'Not authorised',
            payment: null,
            invoices: null,
            nextBillingDate: null
        };
    }

    const { user, company, userCompany } = userSession;

    if (userCompany.role !== 'COMPANY_ADMIN') {
        return {
            error: 'Not authorised',
            payment: null,
            invoices: null,
            nextBillingDate: null
        };
    }

    try {
        const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
        let paymentId = '';
        if (typeof subscription.default_payment_method === 'string') {
            paymentId = subscription.default_payment_method;
        } else {
            paymentId = subscription.default_payment_method?.id || '';
        }
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentId);
        const payment = {
            address: paymentMethod.billing_details.address,
            card: paymentMethod.card
        };
        const nextBillingDate = subscription.items.data[0].current_period_end;

        const invoices = await stripe.invoices.list({
            customer: customerId
        });
        return { payment, invoices, nextBillingDate, error: null };
    } catch (error) {
        return {
            error: `There was an error - ${error}`,
            payment: null,
            invoices: null,
            nextBillingDate: null
        };
    }
};

export const createPortalSession = async (
    customerId: string,
    subscriptionId?: string
) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            error: 'Not authorised'
        };
    }
    try {
        // Assume you have the customer ID (e.g., from your database or session)

        if (!customerId) {
            return { error: 'Customer ID is required' };
        }

        let portalSessionParams: any = {
            customer: customerId,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing` // URL to redirect back to after the portal
        };

        if (subscriptionId) {
            portalSessionParams = {
                ...portalSessionParams,
                flow_data: {
                    type: 'subscription_update',
                    subscription_update: { subscription: subscriptionId }
                }
            };
        }

        // Create a billing portal session
        const portalSession =
            await stripe.billingPortal.sessions.create(portalSessionParams);

        // Return the portal session URL
        return { url: portalSession.url };
    } catch (error) {
        console.error('Error creating portal session:', error);
        return { error: `Internal server error - ${error}` };
    }
};

export const checkDowngradedPlan = async (id: string) => {
    try {
        const company = await prisma.company.findUnique({
            where: { id },
            include: {
                plan: true,
                members: true,
                teams: { include: { nudges: true } }
            }
        });
        if (!company) return null;
        const { maxNudges, maxTeams, maxUsers, maxRecipients } = company.plan;
        if (company.members.length > maxUsers && maxUsers !== 0) {
            await prisma.user.updateMany({
                where: { companyMember: { some: { companyId: id } } },
                data: { status: 'DISABLED' }
            });
        }
        if (company.teams.length > maxTeams && maxTeams !== 0) {
            await prisma.team.updateMany({
                where: { companyId: id },
                data: { status: 'DISABLED' }
            });
            for (const team of company.teams) {
                await prisma.teamMember.updateMany({
                    where: { teamId: team.id },
                    data: { status: 'DISABLED' }
                });
                await prisma.nudge.updateMany({
                    where: { teamId: team.id },
                    data: { status: 'DISABLED' }
                });
            }
        }

        const totalNudges = company.teams.reduce(
            (acc, team) => acc + team.nudges.length,
            0
        );
        if (totalNudges > maxNudges && maxNudges !== 0) {
            await prisma.nudge.updateMany({
                where: {
                    team: {
                        companyId: id // pass your company.id here
                    }
                },
                data: {
                    status: 'DISABLED' // whatever you want to update
                }
            });
        }
        const nudges = await prisma.nudge.findMany({
            where: {
                team: {
                    companyId: id
                }
            },
            include: {
                recipients: true
            }
        });
        for (const nudge of nudges) {
            if (
                nudge.recipients.length > maxRecipients &&
                maxRecipients !== 0
            ) {
                await prisma.nudge.update({
                    where: { id: nudge.id },
                    data: {
                        status: 'DISABLED' // or whatever update you need
                    }
                });
            }
        }
        return true;
    } catch (error) {
        console.log(error);
        return { error };
    }
};
