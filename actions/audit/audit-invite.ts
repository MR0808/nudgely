'use server';

import { logAuditEvent } from './audit';
import type { AuditLogResult, AuditAction } from '@/types/audit';

export async function logCompanyAcceptInvite(
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId: undefined,
        action: 'invite.company_accept_invite',
        category: 'invite',
        description: `Invite accepted`,
        metadata: { ...metadata }
    });
}

export async function logCompanyDeclineInvite(
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId: undefined,
        action: 'invite.company_decline_invite',
        category: 'invite',
        description: `Invite declined`,
        metadata: { ...metadata }
    });
}
