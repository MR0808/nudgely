import { prisma } from '@/lib/prisma';

export type SuppressionReason = 'hard_bounce' | 'complaint';

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

export async function isEmailSuppressed(email: string): Promise<boolean> {
    const record = await prisma.emailSuppression.findUnique({
        where: { email: normalizeEmail(email) },
        select: { id: true }
    });
    return Boolean(record);
}

export async function getSuppressedEmailSet(
    emails: string[]
): Promise<Set<string>> {
    if (emails.length === 0) return new Set();

    const normalized = [...new Set(emails.map(normalizeEmail))];
    const records = await prisma.emailSuppression.findMany({
        where: { email: { in: normalized } },
        select: { email: true }
    });

    return new Set(records.map((r) => r.email));
}

export async function suppressEmail({
    email,
    reason,
    source = 'resend',
    details,
    resendEmailId
}: {
    email: string;
    reason: SuppressionReason;
    source?: string;
    details?: string;
    resendEmailId?: string;
}) {
    const normalized = normalizeEmail(email);

    await prisma.emailSuppression.upsert({
        where: { email: normalized },
        create: {
            email: normalized,
            reason,
            source,
            details,
            resendEmailId
        },
        update: {
            reason,
            source,
            details,
            resendEmailId
        }
    });

    console.log(
        `[email-suppression] Suppressed ${normalized} (${reason})`
    );
}
