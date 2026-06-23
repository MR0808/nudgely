import { Resend } from 'resend';
import type { CreateEmailOptions } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendResendEmail(
    options: CreateEmailOptions
): Promise<{ success: boolean; error: string | null }> {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[mail] RESEND_API_KEY not set — skipping email send');
        return { success: false, error: 'Email service not configured' };
    }

    const { error } = await resend.emails.send(options);

    if (error) {
        console.error('[mail] Resend error:', error);
        return {
            success: false,
            error: error.message || 'Failed to send email'
        };
    }

    return { success: true, error: null };
}
