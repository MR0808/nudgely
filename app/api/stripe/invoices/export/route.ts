import Stripe from 'stripe';
import { stringify } from 'csv-stringify/sync';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil'
});

export async function GET(req: Request) {
    try {
        // Get customer_id from query parameters
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

        // Optional: Add authentication check (e.g., verify customer_id belongs to the user)
        // Example: const session = await getServerSession();
        // if (session.user.stripeCustomerId !== customerId) { return unauthorized; }

        // Fetch invoices for this customer
        const invoices = await stripe.invoices.list({
            customer: customerId,
            limit: 100 // Max per request; pagination handles the rest
        });

        // Prepare CSV data
        const csvData = [];
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

        for await (const invoice of invoices.data) {
            csvData.push([
                invoice.id,
                invoice.number || '',
                invoice.customer_name || 'N/A',
                invoice.customer_email || 'N/A',
                new Date(invoice.created * 1000).toISOString().split('T')[0], // Convert Unix timestamp to YYYY-MM-DD
                (invoice.amount_due / 100).toFixed(2), // Convert cents to dollars
                invoice.currency.toUpperCase(),
                invoice.status,
                invoice.invoice_pdf || 'N/A'
            ]);
        }

        // Generate CSV string
        const csvString = stringify([headers, ...csvData], {
            header: false
        });

        // Set response headers for CSV download
        const headersResponse = new Headers({
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="invoices_${customerId}.csv"`
        });

        return new Response(csvString, {
            status: 200,
            headers: headersResponse
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
