import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

import { suppressEmail } from '@/lib/email-suppression';

const resend = new Resend(process.env.RESEND_API_KEY);

type ResendWebhookEvent = {
    type: string;
    created_at?: string;
    data?: {
        email_id?: string;
        to?: string[];
        bounce?: { message?: string; type?: string; subType?: string };
    };
};

function isHardBounce(bounce?: { type?: string }) {
    if (!bounce?.type) return true;
    return bounce.type.toLowerCase() === 'hard';
}

async function handleBounce(event: ResendWebhookEvent) {
    const bounce = event.data?.bounce;
    if (!isHardBounce(bounce)) {
        console.log(
            `[resend:webhook] Ignoring soft bounce for ${event.data?.to?.join(', ')}`
        );
        return { suppressed: 0, skipped: event.data?.to?.length ?? 0 };
    }

    const recipients = event.data?.to ?? [];
    let suppressed = 0;

    for (const email of recipients) {
        await suppressEmail({
            email,
            reason: 'hard_bounce',
            details: bounce?.message,
            resendEmailId: event.data?.email_id
        });
        suppressed++;
    }

    return { suppressed, skipped: 0 };
}

async function handleComplaint(event: ResendWebhookEvent) {
    const recipients = event.data?.to ?? [];
    let suppressed = 0;

    for (const email of recipients) {
        await suppressEmail({
            email,
            reason: 'complaint',
            resendEmailId: event.data?.email_id
        });
        suppressed++;
    }

    return { suppressed, skipped: 0 };
}

export async function POST(req: NextRequest) {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('[resend:webhook] RESEND_WEBHOOK_SECRET is not set');
        return NextResponse.json(
            { error: 'Webhook not configured' },
            { status: 503 }
        );
    }

    const payload = await req.text();
    const id = req.headers.get('svix-id');
    const timestamp = req.headers.get('svix-timestamp');
    const signature = req.headers.get('svix-signature');

    if (!id || !timestamp || !signature) {
        return NextResponse.json({ error: 'Missing webhook headers' }, {
            status: 400
        });
    }

    let event: ResendWebhookEvent;

    try {
        event = resend.webhooks.verify({
            payload,
            headers: { id, timestamp, signature },
            webhookSecret
        }) as ResendWebhookEvent;
    } catch (error) {
        console.error('[resend:webhook] Signature verification failed:', error);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'email.bounced': {
                const result = await handleBounce(event);
                return NextResponse.json({ received: true, ...result });
            }
            case 'email.complained': {
                const result = await handleComplaint(event);
                return NextResponse.json({ received: true, ...result });
            }
            default:
                return NextResponse.json({ received: true, ignored: event.type });
        }
    } catch (error) {
        console.error('[resend:webhook] Handler error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}
