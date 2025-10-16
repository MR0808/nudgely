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

export async function logNudgeUpdated(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'nudge.nudge_updated',
        category: 'nudge',
        description: `Nudge updated`,
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

export async function logNudgeResumed(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'nudge.nudge_resumed',
        category: 'nudge',
        description: `Nudge resumed`,
        metadata: { ...metadata }
    });
}
