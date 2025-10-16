'use server';

import { logAuditEvent } from './audit';
import type { AuditLogResult, AuditAction } from '@/types/audit';

export async function logNudgeCreated(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'nudge.nudge_created',
        category: 'nudge',
        description: `Nudge created`,
        metadata: { ...metadata }
    });
}

export async function logNudgePaused(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'nudge.nudge_paused',
        category: 'nudge',
        description: `Nudge paused`,
        metadata: { ...metadata }
    });
}
