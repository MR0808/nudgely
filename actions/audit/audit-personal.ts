'use server';

import { logAuditEvent } from './audit';
import type { AuditLogResult, AuditAction } from '@/types/audit';

export async function logPersonalUpdated(
    userId: string,
    action: AuditAction,
    changes: string[],
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action,
        category: 'personal',
        description: `User profile fields: ${changes.join(', ')}`,
        metadata: { ...metadata }
    });
}
