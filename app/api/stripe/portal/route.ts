// app/api/stripe/portal/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const { companyId, returnUrl } = await req.json();
    const company = await prisma.company.findUnique({
        where: { id: companyId }
    });

    if (!company?.stripeCustomerId) throw new Error('No Stripe customer');

    const session = await stripe.billingPortal.sessions.create({
        customer: company.stripeCustomerId,
        return_url: returnUrl
    });

    return NextResponse.json({ url: session.url });
}
