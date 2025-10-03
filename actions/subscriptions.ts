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
