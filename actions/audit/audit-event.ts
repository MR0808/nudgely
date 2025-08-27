'use server';

import { logAuditEvent } from './audit';
import type { AuditLogResult, AuditAction } from '@/types/audit';

export async function logEventCreated(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'event.event_created',
        category: 'event',
        description: `Event created`,
        metadata: { ...metadata }
    });
}

export async function logActivityCreated(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'event.activity_created',
        category: 'event',
        description: `Activity created`,
        metadata: { ...metadata }
    });
}
