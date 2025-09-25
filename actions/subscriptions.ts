'use server';
import Stripe from 'stripe';

// import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { authCheckServer } from '@/lib/authCheck';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil'
});

// export const changePlan = async ({
//     userId,
//     companyId,
//     stripeSubscriptionId,
//     newPriceId,
//     immediatelyCharge
// }: {
//     userId: string;
//     companyId: string;
//     stripeSubscriptionId: string;
//     newPriceId: string;
//     immediatelyCharge?: boolean;
// }) => {
//     // fetch subscription from Stripe to get subscription item id
//     const subscription = await stripe.subscriptions.retrieve(
//         stripeSubscriptionId,
//         {
//             expand: ['items.data.price']
//         }
//     );

//     // get the subscription item id (assuming single-item subscription)
//     const item = subscription.items.data[0];
//     if (!item) throw new Error('No subscription item found');

//     // update subscription item with a new price
//     await stripe.subscriptions.update(stripeSubscriptionId, {
//         items: [
//             {
//                 id: item.id,
//                 price: newPriceId,
//                 quantity: 1
//             }
//         ],
//         proration_behavior: immediatelyCharge ? 'create_prorations' : 'none'
//     });

//     // update DB on success (optimistic — we will also sync from webhooks)
//     await prisma.companySubscription.updateMany({
//         where: { stripeSubscriptionId },
//         data: { priceId: newPriceId }
//     });

//     // refresh server-side rendered data for account page
//     revalidatePath('/company');
// };

// export const cancelSubscription = async ({
//     stripeSubscriptionId,
//     atPeriodEnd
// }: {
//     stripeSubscriptionId: string;
//     atPeriodEnd?: boolean;
// }) => {
//     if (atPeriodEnd) {
//         // schedule cancellation at period end
//         await stripe.subscriptions.update(stripeSubscriptionId, {
//             cancel_at_period_end: true
//         });
//     } else {
//         // immediate cancel
//         await stripe.subscriptions.cancel(stripeSubscriptionId);
//     }
// };

export const createCheckoutSessions = async (
    planId: string,
    companyId: string
) => {
    try {
        const company = await prisma.company.findUnique({
            where: { id: companyId }
        });
        if (!company) return { error: 'Company not found' };

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
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`
        });

        return { sessionId: session.id };
    } catch (error) {
        console.log(error);
        return { error };
    }
};

export const getCustomerPaymentInformation = async (
    subscriptionId?: string
) => {
    if (!subscriptionId)
        return {
            error: 'Not applicable',
            payment: null,
            invoices: null
        };

    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            error: 'Not authorised',
            payment: null,
            invoices: null
        };
    }

    const { user, company, userCompany } = userSession;

    if (userCompany.role !== 'COMPANY_ADMIN') {
        return {
            error: 'Not authorised',
            payment: null,
            invoices: null
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

        const invoices = await stripe.invoices.list({
            subscription: subscriptionId
        });
        return { payment, invoices, error: null };
    } catch (error) {
        return {
            error: `There was an error - ${error}`,
            payment: null,
            invoices: null
        };
    }
};

export const createPortalSession = async (customerId: string) => {
    try {
        // Assume you have the customer ID (e.g., from your database or session)

        if (!customerId) {
            return { error: 'Customer ID is required' };
        }

        // Create a billing portal session
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing` // URL to redirect back to after the portal
        });

        // Return the portal session URL
        return { url: portalSession.url };
    } catch (error) {
        console.error('Error creating portal session:', error);
        return { error: `Internal server error - ${error}` };
    }
};
