import type Stripe from 'stripe';

export type BillingPayment = {
    card: {
        last4: string;
        exp_month: number;
        exp_year: number;
    } | null;
    address: {
        line1: string | null;
        line2: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postal_code: string | null;
    } | null;
};

export type BillingInvoice = {
    id: string;
    created: number;
    amount_paid: number;
    status: string | null;
    invoice_pdf: string | null;
};

export type BillingInvoicesList = {
    data: BillingInvoice[];
};

export function serializeStripePayment(
    payment: {
        address: Stripe.Address | null;
        card: Stripe.PaymentMethod.Card | null | undefined;
    } | null
): BillingPayment | null {
    if (!payment) return null;

    return {
        card: payment.card
            ? {
                  last4: payment.card.last4,
                  exp_month: payment.card.exp_month,
                  exp_year: payment.card.exp_year
              }
            : null,
        address: payment.address
            ? {
                  line1: payment.address.line1,
                  line2: payment.address.line2,
                  city: payment.address.city,
                  state: payment.address.state,
                  country: payment.address.country,
                  postal_code: payment.address.postal_code
              }
            : null
    };
}

export function serializeStripeInvoices(
    invoices: Stripe.ApiList<Stripe.Invoice>
): BillingInvoicesList {
    return {
        data: invoices.data.map((invoice) => ({
            id: invoice.id,
            created: invoice.created ?? 0,
            amount_paid: invoice.amount_paid,
            status: invoice.status,
            invoice_pdf: invoice.invoice_pdf ?? null
        }))
    };
}
