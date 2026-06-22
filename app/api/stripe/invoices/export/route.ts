import { stringify } from 'csv-stringify/sync';

import { authCheckServerWithCompany } from '@/lib/authCheck';
import { stripe } from '@/lib/stripe';

export async function GET(req: Request) {
    const session = await authCheckServerWithCompany();
    if (!session || session.userCompany.role !== 'COMPANY_ADMIN') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
        return new Response(
            JSON.stringify({ error: 'customer_id is required' }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    if (session.company.stripeCustomerId !== customerId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const invoices = await stripe.invoices.list({
            customer: customerId,
            limit: 100
        });

        const csvData: (string | number)[][] = [];
        const headers = [
            'Invoice ID',
            'Number',
            'Customer Name',
            'Customer Email',
            'Date',
            'Amount Due',
            'Currency',
            'Status',
            'Invoice PDF'
        ];

        for (const invoice of invoices.data) {
            csvData.push([
                invoice.id,
                invoice.number || '',
                invoice.customer_name || 'N/A',
                invoice.customer_email || 'N/A',
                new Date(invoice.created * 1000).toISOString().split('T')[0],
                (invoice.amount_due / 100).toFixed(2),
                invoice.currency.toUpperCase(),
                invoice.status || 'unknown',
                invoice.invoice_pdf || 'N/A'
            ]);
        }

        const csvString = stringify([headers, ...csvData], {
            header: false
        });

        return new Response(csvString, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="invoices_${customerId}.csv"`
            }
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to fetch invoices' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}
