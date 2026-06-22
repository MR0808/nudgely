import 'dotenv/config';
import { stripe } from '../lib/stripe';

const customerId = process.argv[2] || 'cus_UkcEa6S9wTWO7t';

async function main() {
    const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 5
    });
    console.log('subscriptions:', JSON.stringify(subs.data, null, 2));

    const sessions = await stripe.checkout.sessions.list({
        customer: customerId,
        limit: 3
    });
    console.log(
        'sessions:',
        JSON.stringify(
            sessions.data.map((s) => ({
                id: s.id,
                status: s.status,
                subscription: s.subscription,
                client_reference_id: s.client_reference_id
            })),
            null,
            2
        )
    );
}

main();
