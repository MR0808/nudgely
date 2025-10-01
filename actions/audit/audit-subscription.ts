'use server';

import { logAuditEvent } from './audit';
import type { AuditLogResult, AuditAction } from '@/types/audit';

export async function logSubscriptionCreate(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'subscription.create_subscription',
        category: 'subscription',
        description: `Subscription created`,
        metadata: { ...metadata }
    });
}

export async function logSubscriptionUpdate(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'subscription.update_subscription',
        category: 'subscription',
        description: `Subscription updated`,
        metadata: { ...metadata }
    });
}

export async function logSubscriptionCancel(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'subscription.cancel_subscription',
        category: 'subscription',
        description: `Subscription canceled`,
        metadata: { ...metadata }
    });
}
