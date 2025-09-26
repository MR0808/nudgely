import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma'; // your prisma client

export async function POST(req: Request) {
    const body = await req.json();
    const { priceId, companyId, userId, successUrl, cancelUrl } = body;

    // find or create customer (link to your user)
    let company = await prisma.company.findUnique({ where: { id: companyId } });
    let user = await prisma.user.findUnique({
        where: { id: userId }
    });

    let customerId = company?.stripeCustomerId;
    if (!customerId) {
        const cust = await stripe.customers.create({ email: user?.email });
        customerId = cust.id;
        await prisma.company.update({
            where: { id: companyId },
            data: { stripeCustomerId: customerId }
        });
    }

    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true
    });

    return NextResponse.json({ url: session.url, id: session.id });
}
