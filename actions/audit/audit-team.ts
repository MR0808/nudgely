'use server';

import { logAuditEvent } from './audit';
import type { AuditLogResult, AuditAction } from '@/types/audit';

export async function logTeamCreated(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'team.team_created',
        category: 'team',
        description: `Team created`,
        metadata: { ...metadata }
    });
}
