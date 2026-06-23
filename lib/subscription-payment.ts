import { prisma } from '@/lib/prisma';

export const PAYMENT_BLOCKED_STATUSES = ['past_due', 'unpaid'] as const;

export type PaymentBlockedStatus =
    (typeof PAYMENT_BLOCKED_STATUSES)[number];

export function isSubscriptionPaymentBlocked(
    status: string | null | undefined
): boolean {
    if (!status) return false;
    return PAYMENT_BLOCKED_STATUSES.includes(
        status as PaymentBlockedStatus
    );
}

export function subscriptionPaymentBlockedMessage() {
    return 'Your subscription has a payment issue. Update billing to continue using Nudgely.';
}

export async function getCompanyPaymentBlock(companyId: string) {
    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: {
            companySubscription: { select: { status: true } }
        }
    });

    const blocked = isSubscriptionPaymentBlocked(
        company?.companySubscription?.status
    );

    return {
        blocked,
        message: blocked ? subscriptionPaymentBlockedMessage() : null
    };
}

/** Prisma filter: company subscription is not in a payment-blocked state. */
export const companySubscriptionNotPaymentBlocked = {
    OR: [
        { companySubscriptionId: null },
        {
            companySubscription: {
                status: { notIn: ['past_due', 'unpaid'] }
            }
        }
    ]
};
