'use server';

import { logAuditEvent } from './audit';
import type { AuditLogResult, AuditAction } from '@/types/audit';

export async function logNudgeCompleted(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'completion.completed_nudge',
        category: 'completion',
        description: `Nudge completion`,
        metadata: { ...metadata }
    });
}
